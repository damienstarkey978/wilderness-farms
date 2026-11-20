import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { Client } from "pg";
import { MessageChannel, Worker, receiveMessageOnPort } from "node:worker_threads";
import { translatePostgres, type Row, type SqlDatabase, type SqlStatement } from "./sql";

void Client;

function resolvePg(): string {
  const attempts = [
    () => createRequire(import.meta.url).resolve("pg"),
    () => createRequire(path.join(process.cwd(), "package.json")).resolve("pg"),
    () => path.join(process.cwd(), "node_modules", "pg", "lib", "client.js"),
  ];
  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const resolved = attempt();
      if (resolved.startsWith("/") && existsSync(/*turbopackIgnore: true*/ resolved)) return resolved;
      errors.push(resolved);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join(" ") || "Could not load the database driver.");
}

type Response =
  | { id: number; ok: true; rows?: Row[]; changes?: number }
  | { id: number; ok: false; error: string };

const WORKER_SOURCE = `
const { parentPort, workerData } = require("worker_threads");
const { Client } = require(workerData.pgPath);
const { port, sab, connectionString } = workerData;
const flag = new Int32Array(sab);
let client = null;

function scrub(error) {
  const message = String(error && error.message ? error.message : error);
  return message.split(connectionString).join("postgres://database");
}

async function database() {
  if (client) return client;
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  client = new Client({
    connectionString: url.toString(),
    ssl: sslmode && sslmode !== "disable" ? { rejectUnauthorized: false } : undefined,
  });
  client.on("error", () => {
    const dying = client;
    client = null;
    if (dying) dying.end().catch(() => {});
  });
  await client.connect();
  return client;
}

function finish(response) {
  port.postMessage(response);
  Atomics.store(flag, 0, 1);
  Atomics.notify(flag, 0);
}

port.on("message", (msg) => {
  database()
    .then(async (db) => {
      if (msg.op === "exec") {
        for (const statement of msg.statements) {
          if (statement) await db.query(statement);
        }
        finish({ id: msg.id, ok: true });
        return;
      }
      const result = await db.query(msg.sql, msg.args);
      finish({ id: msg.id, ok: true, rows: result.rows, changes: result.rowCount || 0 });
    })
    .catch((error) => finish({ id: msg.id, ok: false, error: scrub(error) }));
});

port.postMessage({ ready: true });
Atomics.store(flag, 0, 1);
Atomics.notify(flag, 0);
`;

class PostgresDatabase implements SqlDatabase {
  private worker: Worker;
  private port: MessageChannel["port1"];
  private flag: Int32Array;
  private nextId = 1;
  private secret: string;

  constructor(connectionString: string) {
    this.secret = connectionString;
    const channel = new MessageChannel();
    const sab = new SharedArrayBuffer(4);
    this.flag = new Int32Array(sab);
    this.port = channel.port1;
    this.worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: {
        port: channel.port2,
        sab,
        connectionString,
        pgPath: resolvePg(),
      },
      transferList: [channel.port2],
    });
    let workerError = "";
    const wake = (error?: unknown) => {
      if (error) workerError = error instanceof Error ? error.message : String(error);
      Atomics.store(this.flag, 0, 1);
      Atomics.notify(this.flag, 0);
    };
    this.worker.on("error", wake);
    this.worker.on("exit", (code) => {
      if (code !== 0 && !workerError) workerError = `Database worker exited (${code}).`;
      wake();
    });
    this.wait();
    const ready = receiveMessageOnPort(this.port);
    if (!ready?.message || !(ready.message as { ready?: boolean }).ready) {
      throw new Error((workerError || "Database worker did not start.").replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://database"));
    }
  }

  exec(sql: string): void {
    const statements = sql
      .split(";")
      .map((statement) => translatePostgres(statement))
      .filter(Boolean);
    if (statements.length === 0) return;
    this.call({ op: "exec", statements });
  }

  prepare(sql: string): SqlStatement {
    const translated = translatePostgres(sql);
    return {
      get: (...args) => this.call({ op: "query", sql: translated, args }).rows?.[0],
      all: (...args) => this.call({ op: "query", sql: translated, args }).rows ?? [],
      run: (...args) => ({ changes: this.call({ op: "query", sql: translated, args }).changes ?? 0 }),
    };
  }

  close(): void {
    void this.worker.terminate();
  }

  private call(body: { op: "exec"; statements: string[] } | { op: "query"; sql: string; args: unknown[] }): {
    rows?: Row[];
    changes?: number;
  } {
    const id = this.nextId++;
    Atomics.store(this.flag, 0, 0);
    this.port.postMessage({ ...body, id });
    const status = this.wait();
    const received = receiveMessageOnPort(this.port);
    const response = received?.message as Response | undefined;
    if (status === "timed-out" || !response || response.id !== id) {
      throw new Error("Database timed out.");
    }
    if (!response.ok) throw new Error(response.error.split(this.secret).join("postgres://database"));
    return response;
  }

  private wait(): "ok" | "timed-out" | "not-equal" {
    const result = Atomics.wait(this.flag, 0, 0, 20000);
    return result === "timed-out" ? "timed-out" : "ok";
  }
}

export function openPostgres(connectionString: string): SqlDatabase {
  return new PostgresDatabase(connectionString);
}
