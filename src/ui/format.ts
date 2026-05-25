import { bold, dim, gray, green, red, yellow } from "./colors.ts";
import type { CheckResult, Report } from "../types.ts";

export const ICON = {
  pass: "✓",
  warn: "!",
  fail: "✕",
  skip: "·",
};

function line(result: CheckResult): string {
  if (result.status === "pass") {
    return `  ${green(ICON.pass)} ${result.name}`;
  }
  if (result.status === "warn") {
    const msg = result.message ? ` ${dim("— " + result.message)}` : "";
    return `  ${yellow(ICON.warn)} ${result.name}${msg}`;
  }
  if (result.status === "fail") {
    const msg = result.message ? ` ${dim("— " + result.message)}` : "";
    return `  ${red(ICON.fail)} ${result.name}${msg}`;
  }
  return `  ${gray(ICON.skip)} ${result.name}`;
}

function section(title: string, items: CheckResult[]): string {
  if (items.length === 0) return "";
  const heading = bold(title);
  const lines = items.map(line).join("\n");
  return `${heading}\n${lines}\n`;
}

export function renderReport(report: Report): string {
  const parts: string[] = [];
  parts.push(bold("Repo Doctor"));
  parts.push("");
  parts.push(`Score: ${bold(`${report.score}/100`)}`);
  parts.push(`Status: ${report.ready ? green(report.status) : red(report.status)}`);
  parts.push("");

  const blockerSection = section("Blockers", report.blockers);
  if (blockerSection) parts.push(blockerSection);

  const warningSection = section("Warnings", report.warnings);
  if (warningSection) parts.push(warningSection);

  const passedSection = section("Passed", report.passed);
  if (passedSection) parts.push(passedSection);

  if (report.skipped.length > 0) {
    parts.push(section(dim("Skipped"), report.skipped));
  }

  return parts.join("\n").replace(/\n+$/g, "") + "\n";
}
