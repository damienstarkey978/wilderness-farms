export type Row = Record<string, unknown>;

export type RunResult = { changes: number };

export type SqlStatement = {
  get(...args: unknown[]): Row | undefined;
  all(...args: unknown[]): Row[];
  run(...args: unknown[]): RunResult;
};

export type SqlDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
  close(): void;
};

/** The demo walkthrough keeps these people in memory. They are not signups. */
export const DEMO_WAITLIST_NAMES = [
  "Sample Sam Shore",
  "Demo Dana Dune",
  "Test Tess Tide",
  "Fake Finn Foam",
  "Pretend Pat Pier",
  "Mock Mo Marsh",
  "Example Evie Egg",
  "Placeholder Pip Palm",
  "Sample Sue Shell",
  "Demo Drew Dock",
] as const;

export function translatePostgres(sql: string): string {
  let text = sql.trim();
  if (text === "BEGIN IMMEDIATE") return "BEGIN";
  if (/^PRAGMA\s+(journal_mode|busy_timeout)\b/i.test(text)) return "";
  const info = text.match(/^PRAGMA\s+table_info\(([^)]+)\)\s*$/i);
  if (info) {
    const table = info[1].replace(/['"]/g, "");
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
      throw new Error("Unexpected table name.");
    }
    return `SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`;
  }
  let index = 0;
  text = text.replace(/'(?:''|[^'])*'|\?/g, (part) => (part === "?" ? `$${++index}` : part));
  if (/^INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(text)) {
    text = text.replace(/^INSERT\s+OR\s+IGNORE\s+INTO\b/i, "INSERT INTO");
    if (!/\bON\s+CONFLICT\b/i.test(text)) text += " ON CONFLICT DO NOTHING";
  }
  return text;
}
