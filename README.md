# repo-doctor

Bun-first CLI that scans a repository and tells you whether it looks ready to build, test, publish, or deploy.

- Zero runtime dependencies
- Single small binary, designed for terminals and CI
- Bun-only — uses `Bun.argv`, `Bun.file`, `Bun.spawn`, and `bun test`

## Install

The recommended way is via `bunx` (no install):

```bash
bunx repo-doctor
```

Or install globally with Bun:

```bash
bun add -g repo-doctor
```

> Requires Bun ≥ 1.1.0.

## Usage

```bash
repo-doctor                       # scan the current directory
repo-doctor scan                  # same, explicit
repo-doctor scan --json           # machine-readable output (no colors)
repo-doctor scan --ci             # exit non-zero if blockers exist
repo-doctor scan --run            # also run typecheck/test/lint/build
repo-doctor scan --run --timeout=120
repo-doctor init                  # write .env.example from .env (values stripped)
repo-doctor --help
repo-doctor --version
```

### Example output

```
Repo Doctor

Score: 74/100
Status: Not ready to deploy

Blockers
  ✕ typecheck failed — TS2304: Cannot find name 'foo'
  ✕ package.json is invalid

Warnings
  ! no test script found
  ! .env exists but .env.example is missing

Passed
  ✓ package.json found
  ✓ git repository detected
  ✓ build script exists
```

### JSON output

`scan --json` prints a `Report` document and no ANSI:

```json
{
  "score": 70,
  "status": "Ready with warnings",
  "ready": true,
  "blockers": [],
  "warnings": [
    { "id": "git-repo", "name": "no git repository", "status": "warn", "severity": "warning", "message": "run `git init` to initialize" }
  ],
  "passed": [
    { "id": "package-json-exists", "name": "package.json found", "status": "pass", "severity": "info" }
  ],
  "skipped": []
}
```

### CI usage

```yaml
# GitHub Actions
- uses: oven-sh/setup-bun@v2
- run: bunx repo-doctor scan --ci
```

`scan --ci` exits `1` if any blocker fails, `0` otherwise. Combine with `--json` if you want to parse the report.

## What it checks

| Check                  | Severity | Description                                                          |
| ---------------------- | -------- | -------------------------------------------------------------------- |
| `package-json-exists`  | blocker  | `package.json` exists and is valid JSON                              |
| `lockfile-present`     | warning  | A lockfile is present                                                |
| `lockfile-mismatch`    | blocker  | Multiple lockfiles present                                           |
| `script-build/test`    | warning  | Build and test scripts present in `package.json`                     |
| `script-lint/typecheck`| info     | Lint and typecheck scripts present                                   |
| `git-repo`             | warning  | Repository is initialized                                            |
| `git-status`           | warning  | Working tree is clean                                                |
| `env-example`          | warning  | `.env.example` exists alongside `.env`                               |
| `run-*` (with `--run`) | blocker  | Allow-listed scripts run successfully under a per-script timeout     |

### Scoring

Each check has a weight: blocker = 25, warning = 8, info = 2. A `fail` loses the full weight, a `warn` loses half. The total is normalized to 0–100.

## `--run` safety

`--run` only invokes scripts from a fixed allow-list: `typecheck`, `test`, `lint`, `build`. Each script runs under a per-script timeout (default 60s, override with `--timeout=<seconds>`). Anything else in `package.json scripts` is ignored.

## Develop

```bash
bun install
bun run src/cli.ts        # run from source
bun test                  # run tests
bun run typecheck         # tsc --noEmit (uses devDep)
bun run build             # bundle to dist/cli.js with --target=bun --minify
```

## Publish notes

The package is configured for npm publishing from Bun:

- `bin.repo-doctor → dist/cli.js`
- `files: ["dist", "README.md", "LICENSE"]` — only the built CLI ships
- `prepublishOnly` runs `bun run build` so the dist is always fresh
- Built file keeps the `#!/usr/bin/env bun` shebang and is executable

Before publishing:

1. Bump `version`.
2. Run `bun test && bun run typecheck && bun run build && bash scripts/prove-real-scan.sh` and execute `./dist/cli.js --help` manually.
3. `bun publish` (or `npm publish --access public`).

## Limitations

- `--run` does not execute custom scripts (`postinstall`, `prepare`, etc.) by design.
- Running `bun run src/cli.ts` from a directory with a broken local `package.json` may cause Bun to print its own JSON parse errors before the CLI output — a dev-only artifact; installed users do not see this.
- Lockfile checks verify presence and uniqueness, not checksum.
- No monorepo workspace traversal yet.

## License

MIT
