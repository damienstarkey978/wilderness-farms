declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  interface StatementSync {
    run(...params: SqlValue[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: SqlValue[]): SqlRow | undefined;
    all(...params: SqlValue[]): SqlRow[];
  }

  type SqlValue = string | number | bigint | null | Uint8Array;
  type SqlRow = Record<string, SqlValue>;
}
