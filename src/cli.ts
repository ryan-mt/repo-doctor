#!/usr/bin/env bun
import { join } from "node:path";
import { runChecks } from "./core/run-checks.ts";
import { buildReport, reportToJson } from "./core/report.ts";
import { renderReport } from "./ui/format.ts";

const VERSION = "0.1.0";

interface ParsedArgs {
  command: string;
  flags: Set<string>;
  values: Map<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const positional: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const body = arg.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        values.set(body.slice(0, eq), body.slice(eq + 1));
      } else {
        flags.add(body);
      }
    } else if (arg.startsWith("-")) {
      flags.add(arg.slice(1));
    } else {
      positional.push(arg);
    }
  }

  const command = positional[0] ?? "scan";
  return { command, flags, values };
}

function printHelp(): void {
  const text = `repo-doctor — scan a repository for build, test, and deploy readiness.

Usage
  repo-doctor [command] [options]

Commands
  scan          Run all checks against the current directory (default)
  init          Create a starter .env.example if .env is present
  help          Show this help

Options
  --json              Print results as JSON (no colors)
  --ci                Exit non-zero if blockers exist
  --run               Run typecheck/test/lint/build scripts when present
  --timeout=<sec>     Per-script timeout for --run (default 60)
  --version, -v       Print version
  --help, -h          Show this help

Examples
  repo-doctor
  repo-doctor scan --json
  repo-doctor scan --ci
  repo-doctor scan --run --timeout=120
`;
  process.stdout.write(text);
}

function parseTimeoutMs(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(
      `invalid --timeout value: "${raw}" (expected a positive number of seconds)`
    );
  }
  return Math.round(seconds * 1000);
}

async function runScan(args: ParsedArgs): Promise<number> {
  const root = process.cwd();
  const runTimeoutMs = parseTimeoutMs(args.values.get("timeout"));
  const results = await runChecks({
    root,
    runScripts: args.flags.has("run"),
    runTimeoutMs,
  });
  const report = buildReport(results);

  if (args.flags.has("json")) {
    process.stdout.write(reportToJson(report) + "\n");
  } else {
    process.stdout.write(renderReport(report));
  }

  if (args.flags.has("ci") && !report.ready) return 1;
  return 0;
}

async function runInit(): Promise<number> {
  const root = process.cwd();
  const envPath = join(root, ".env");
  const examplePath = join(root, ".env.example");

  const envExists = await Bun.file(envPath).exists();
  const exampleExists = await Bun.file(examplePath).exists();

  if (!envExists) {
    process.stdout.write("no .env found — nothing to template.\n");
    return 0;
  }
  if (exampleExists) {
    process.stdout.write(".env.example already exists.\n");
    return 0;
  }

  const text = await Bun.file(envPath).text();
  const stripped = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      const eq = line.indexOf("=");
      if (eq < 0) return line;
      return line.slice(0, eq + 1);
    })
    .join("\n");

  await Bun.write(examplePath, stripped);
  process.stdout.write("created .env.example from .env (values stripped).\n");
  return 0;
}

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv);

  if (args.flags.has("help") || args.flags.has("h") || args.command === "help") {
    printHelp();
    return;
  }

  if (args.flags.has("version") || args.flags.has("v")) {
    process.stdout.write(`repo-doctor ${VERSION}\n`);
    return;
  }

  let code = 0;
  switch (args.command) {
    case "scan":
      code = await runScan(args);
      break;
    case "init":
      code = await runInit();
      break;
    default:
      process.stderr.write(`unknown command: ${args.command}\n`);
      printHelp();
      code = 2;
  }

  process.exit(code);
}

main().catch((err) => {
  process.stderr.write(`repo-doctor: ${(err as Error).message}\n`);
  process.exit(1);
});
