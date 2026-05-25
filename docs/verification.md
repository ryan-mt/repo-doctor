# Verification & honest scope

This document explains what `repo-doctor` actually verifies, what it does not,
and how to reproduce the proofs yourself.

## What it actually verifies

Every check reads real files from the current working directory or shells out to
real tools. There is no static-analysis engine, no AST walker, and no synthetic
data path.

| Check (id) | What it really does |
| --- | --- |
| `package-json-exists` | `Bun.file("package.json").exists()` and `JSON.parse(await .text())` |
| `lockfile-present` / `lockfile-mismatch` | Probes for `bun.lockb`, `bun.lock`, `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` and counts |
| `script-build/test/lint/typecheck` | Reads `scripts` map in the parsed `package.json` |
| `git-repo` | Checks for `.git/HEAD` |
| `git-status` | Runs `git status --porcelain` via `Bun.spawn` and parses output |
| `env-example` | Probes for `.env` and `.env.example` |
| `run-build/test/lint/typecheck` (with `--run`) | `Bun.spawn([pm, "run", name])` against the real script, under a per-script timeout |

`scan --json` writes `JSON.stringify(report, null, 2)`. The body never goes
through the color helpers, so the output is free of ANSI control codes (verified
by `tests/cli.test.ts`).

## What it does NOT verify

`repo-doctor` is **not** a static analyzer, security scanner, or correctness
prover. In particular it does not:

- read or analyze your source code beyond `package.json`;
- check API design, types, or runtime behavior on its own;
- audit dependencies for known vulnerabilities;
- verify that `package.json` declares what it actually ships;
- inspect CI configuration;
- understand monorepo workspaces.

If you need any of the above, run the appropriate dedicated tool.

## `scan` vs `scan --run`

- `scan` is a **pure file inspection** pass. It is fast, has no side effects,
  and never executes project scripts.
- `scan --run` opts into **executing** the allow-listed scripts
  (`typecheck`, `test`, `lint`, `build`) in your `package.json`. Each script
  runs under a configurable timeout (default 60s, override with
  `--timeout=<seconds>`).

This means **the part of `repo-doctor` that indirectly verifies your real source
code is `scan --run`**: whether your code typechecks, lints, builds, and tests
is decided by your own scripts, not by `repo-doctor`. `repo-doctor` reports
those results truthfully.

`repo-doctor` does **not** invoke `postinstall`, `prepare`, `prepublishOnly`, or
any other script outside the allow-list. There is no script-name passthrough.

## Reproducing the proofs

### One command

```bash
bash scripts/prove-real-scan.sh
```

The script builds the CLI, creates seven real temporary repositories under
`/tmp/repo-doctor-proof-*`, runs the built binary against each, and prints
`PASS` / `FAIL` for every assertion. It is offline, deterministic, and cleans
up after itself.

### Scenarios covered

| ID | Scenario | Expected behavior |
| -- | -------- | ----------------- |
| A | Healthy repo (valid `package.json`, `bun.lock`, all scripts, clean git) | no blockers, `scan --ci` exits `0`, JSON valid |
| B | Invalid `package.json` (malformed JSON) | blocker reported, `scan --ci` exits non-zero |
| C | Dirty git tree (untracked file) | warning reported, `scan --ci` exits `0` |
| D | `.env` without `.env.example` | warning reported, `scan --ci` exits `0` |
| E | Multiple lockfiles (`bun.lock` + `package-lock.json`) | blocker reported, `scan --ci` exits non-zero |
| F | `--run` executes a real failing script (`lint: exit 3`) | failure reported truthfully, `scan --ci --run` exits non-zero |
| G | `--run` against a script that sleeps longer than the timeout | "timed out" reported, process does not hang |

### Manual smoke commands

After `bun run build`, the built binary lives at `dist/cli.js` and can be
exercised directly:

```bash
./dist/cli.js --version
./dist/cli.js scan
./dist/cli.js scan --json | bun -e 'JSON.parse(await Bun.stdin.text())'
./dist/cli.js scan --ci ; echo "exit=$?"
./dist/cli.js scan --run --timeout=60
```

Run any of those against a real repository on your disk to see real results.

## Limitations & honest caveats

- **Severity rules are opinions.** "Lockfile mismatch is a blocker" and
  ".env without .env.example is a warning" are choices that make sense for many
  projects but not all. They are documented in code (`src/checks/*.ts`) and in
  the README.
- **`--run` runs your scripts.** They can have side effects (write to disk,
  modify caches, etc.). The timeout protects you from hangs, not from
  side-effectful scripts.
- **Bun runtime artifacts:** when invoking `bun run src/cli.ts` from inside a
  directory whose `package.json` is malformed, Bun itself prints a parse error
  before `repo-doctor` runs. Installed users running the built binary do not
  hit this.
- **No monorepo traversal.** `repo-doctor` only inspects the directory it is
  invoked in.
- **No vulnerability scanning.** Use `bun audit` / `npm audit` /
  `pnpm audit` separately.

If something looks off, please open an issue with the JSON output of
`scan --json`; that is the canonical, machine-readable artifact and contains
everything `repo-doctor` concluded and why.
