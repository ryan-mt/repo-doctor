#!/usr/bin/env bash
#
# prove-real-scan.sh
#
# Real-scan proof harness for repo-doctor.
# Builds the CLI, creates real temporary repos under /tmp, runs the built
# binary against each one, and asserts the exit code and JSON shape.
#
# This script is offline. It does not publish anything. It does not touch
# anything outside /tmp/repo-doctor-proof-* and the project's dist/ dir.

set -uo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="$PROJECT_ROOT/dist/cli.js"
WORK_ROOT="$(mktemp -d -t repo-doctor-proof-XXXXXX)"
PASS=0
FAIL=0
FAILED_SCENARIOS=()

reset_colors=$'\033[0m'
red=$'\033[31m'
green=$'\033[32m'
dim=$'\033[2m'

cleanup() {
  rm -rf "$WORK_ROOT"
}
trap cleanup EXIT

log() { printf '%s\n' "$*"; }
section() { printf '\n%s== %s ==%s\n' "$dim" "$1" "$reset_colors"; }
pass() { printf '%sPASS%s %s\n' "$green" "$reset_colors" "$1"; PASS=$((PASS + 1)); }
fail() { printf '%sFAIL%s %s\n' "$red" "$reset_colors" "$1"; FAIL=$((FAIL + 1)); FAILED_SCENARIOS+=("$1"); }

# run_cli <cwd> <args...>: echoes the command, then runs it. Stdout captured to $OUT, stderr to $ERR,
# exit code to $CODE.
run_cli() {
  local cwd="$1"; shift
  printf '%s$ (cd %s && %s %s)%s\n' "$dim" "$cwd" "$CLI" "$*" "$reset_colors"
  OUT="$(cd "$cwd" && NO_COLOR=1 "$CLI" "$@" 2>/tmp/repo-doctor-proof-stderr)"
  CODE=$?
  ERR="$(cat /tmp/repo-doctor-proof-stderr)"
  rm -f /tmp/repo-doctor-proof-stderr
}

assert_eq() {
  local expected="$1" actual="$2" label="$3"
  if [ "$expected" = "$actual" ]; then
    pass "$label (got $actual)"
  else
    fail "$label (expected $expected, got $actual)"
  fi
}

assert_contains() {
  local needle="$1" haystack="$2" label="$3"
  case "$haystack" in
    *"$needle"*) pass "$label" ;;
    *) fail "$label (did not contain '$needle')" ;;
  esac
}

assert_json_valid() {
  local payload="$1" label="$2"
  if printf '%s' "$payload" | bun -e 'JSON.parse(await Bun.stdin.text())' >/dev/null 2>&1; then
    pass "$label"
  else
    fail "$label (not valid JSON)"
  fi
}

# json_field <json> <field>: prints the value of a top-level field using bun.
json_field() {
  printf '%s' "$1" | bun -e "const o=JSON.parse(await Bun.stdin.text()); const v=o[\"$2\"]; console.log(typeof v==='object'?JSON.stringify(v):v);"
}

mkdir_repo() {
  local name="$1"
  local p="$WORK_ROOT/$name"
  mkdir -p "$p"
  echo "$p"
}

git_init_clean() {
  local repo="$1"
  (
    cd "$repo"
    git init -q
    git config user.email "proof@example.com"
    git config user.name "Proof"
    git add -A
    git commit -q -m "init" >/dev/null 2>&1 || true
  )
}

section "Build CLI"
(cd "$PROJECT_ROOT" && bun run build) || {
  fail "build CLI"
  exit 1
}
if [ ! -x "$CLI" ]; then
  fail "built CLI not executable at $CLI"
  exit 1
fi
pass "CLI built at $CLI"

# ------------------------------------------------------------------------------
# Scenario A — Healthy repo
# valid package.json, bun.lock, all required scripts (echo true), .env.example
# Expected: no blockers, scan --ci exits 0, scan --json valid
# ------------------------------------------------------------------------------
section "A. Healthy repo"
A=$(mkdir_repo "A-healthy")
cat >"$A/package.json" <<'JSON'
{
  "name": "demo",
  "version": "0.0.1",
  "scripts": {
    "build": "true",
    "test": "true",
    "lint": "true",
    "typecheck": "true"
  }
}
JSON
: >"$A/bun.lock"
echo "FOO=" >"$A/.env.example"
git_init_clean "$A"

run_cli "$A" scan --json
assert_eq "0" "$CODE" "A: scan --json exits 0"
assert_json_valid "$OUT" "A: JSON is valid"
blockers=$(json_field "$OUT" blockers)
assert_eq "[]" "$blockers" "A: zero blockers"

run_cli "$A" scan --ci
assert_eq "0" "$CODE" "A: scan --ci exits 0"

# ------------------------------------------------------------------------------
# Scenario B — Invalid package.json
# Expected: blocker reported, scan --ci exits non-zero
# ------------------------------------------------------------------------------
section "B. Invalid package.json"
B=$(mkdir_repo "B-invalid-json")
printf '{ this is not valid json\n' >"$B/package.json"

run_cli "$B" scan --json
assert_eq "0" "$CODE" "B: scan --json itself exits 0 (no --ci)"
assert_contains "package.json is invalid" "$OUT" "B: invalid package.json reported"

run_cli "$B" scan --ci
if [ "$CODE" -ne 0 ]; then
  pass "B: scan --ci exits non-zero (got $CODE)"
else
  fail "B: scan --ci should be non-zero, got $CODE"
fi

# ------------------------------------------------------------------------------
# Scenario C — Dirty git repo
# git init, commit, then leave an untracked file
# Expected: warning reported, scan --ci exits 0 (no blockers)
# ------------------------------------------------------------------------------
section "C. Dirty git repo"
C=$(mkdir_repo "C-dirty-git")
cat >"$C/package.json" <<'JSON'
{ "name": "c", "version": "0.0.1", "scripts": { "build": "true", "test": "true" } }
JSON
: >"$C/bun.lock"
git_init_clean "$C"
echo "untracked" >"$C/untracked.txt"

run_cli "$C" scan --json
assert_eq "0" "$CODE" "C: scan --json exits 0"
assert_contains "uncommitted changes" "$OUT" "C: dirty tree reported as warning"

run_cli "$C" scan --ci
assert_eq "0" "$CODE" "C: scan --ci exits 0 (no blockers)"

# ------------------------------------------------------------------------------
# Scenario D — Missing .env.example
# .env exists but .env.example missing → warning per implemented rule
# Expected: warning, scan --ci exits 0
# ------------------------------------------------------------------------------
section "D. Missing .env.example"
D=$(mkdir_repo "D-missing-env-example")
cat >"$D/package.json" <<'JSON'
{ "name": "d", "version": "0.0.1", "scripts": { "build": "true", "test": "true" } }
JSON
: >"$D/bun.lock"
echo "SECRET=1" >"$D/.env"
git_init_clean "$D"

run_cli "$D" scan --json
assert_contains ".env.example is missing" "$OUT" "D: missing .env.example reported"

run_cli "$D" scan --ci
assert_eq "0" "$CODE" "D: scan --ci exits 0 (rule says warning, not blocker)"

# ------------------------------------------------------------------------------
# Scenario E — Lockfile mismatch
# Multiple lockfiles present → blocker per implemented rule
# Expected: blocker, scan --ci exits non-zero
# ------------------------------------------------------------------------------
section "E. Lockfile mismatch"
E=$(mkdir_repo "E-lockfile-mismatch")
cat >"$E/package.json" <<'JSON'
{ "name": "e", "version": "0.0.1", "scripts": { "build": "true", "test": "true" } }
JSON
: >"$E/bun.lock"
: >"$E/package-lock.json"
git_init_clean "$E"

run_cli "$E" scan --json
assert_contains "multiple lockfiles present" "$OUT" "E: lockfile mismatch reported"

run_cli "$E" scan --ci
if [ "$CODE" -ne 0 ]; then
  pass "E: scan --ci exits non-zero (got $CODE)"
else
  fail "E: scan --ci should be non-zero, got $CODE"
fi

# ------------------------------------------------------------------------------
# Scenario F — Real script execution (one fails)
# Allow-listed scripts; lint is `exit 3` so --run should report it
# Expected: scan --ci --run exits non-zero
# ------------------------------------------------------------------------------
section "F. Real script execution — one fails"
F=$(mkdir_repo "F-run-fails")
cat >"$F/package.json" <<'JSON'
{
  "name": "f",
  "version": "0.0.1",
  "scripts": {
    "build": "echo build-ok",
    "test": "echo test-ok",
    "lint": "sh -c 'exit 3'",
    "typecheck": "echo type-ok"
  }
}
JSON
: >"$F/bun.lock"
git_init_clean "$F"

run_cli "$F" scan --run --timeout=10 --json
assert_eq "0" "$CODE" "F: scan --run --json itself exits 0 (no --ci)"
assert_contains "lint failed" "$OUT" "F: failing lint is reported"
assert_contains "build passed" "$OUT" "F: passing build is reported"

run_cli "$F" scan --ci --run --timeout=10
if [ "$CODE" -ne 0 ]; then
  pass "F: scan --ci --run exits non-zero on failing script (got $CODE)"
else
  fail "F: scan --ci --run should be non-zero, got $CODE"
fi

# ------------------------------------------------------------------------------
# Scenario G — Timeout proof
# build script sleeps 5s; we set --timeout=1 (1 second)
# Expected: timed out reported, command does not hang
# ------------------------------------------------------------------------------
section "G. Timeout proof"
G=$(mkdir_repo "G-timeout")
cat >"$G/package.json" <<'JSON'
{
  "name": "g",
  "version": "0.0.1",
  "scripts": {
    "build": "sleep 5"
  }
}
JSON
: >"$G/bun.lock"
git_init_clean "$G"

started=$(date +%s)
run_cli "$G" scan --run --timeout=1
ended=$(date +%s)
elapsed=$((ended - started))

assert_contains "build timed out" "$OUT" "G: timeout is reported as a check"
if [ "$elapsed" -lt 8 ]; then
  pass "G: command did not hang (elapsed ${elapsed}s)"
else
  fail "G: command took ${elapsed}s, which is too long"
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
section "Summary"
printf '%sPASSED:%s %d\n' "$green" "$reset_colors" "$PASS"
printf '%sFAILED:%s %d\n' "$red" "$reset_colors" "$FAIL"
if [ "$FAIL" -ne 0 ]; then
  printf 'Failed scenarios:\n'
  for s in "${FAILED_SCENARIOS[@]}"; do
    printf '  - %s\n' "$s"
  done
  exit 1
fi
exit 0
