import { join } from "node:path";
import type { CheckResult } from "../types.ts";

export async function checkEnv(root: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const envExists = await Bun.file(join(root, ".env")).exists();
  const envExampleExists = await Bun.file(join(root, ".env.example")).exists();

  if (!envExists && !envExampleExists) {
    return results;
  }

  if (envExists && !envExampleExists) {
    results.push({
      id: "env-example",
      name: ".env exists but .env.example is missing",
      status: "warn",
      severity: "warning",
      message: "commit a .env.example to document required variables",
    });
    return results;
  }

  if (envExampleExists) {
    results.push({
      id: "env-example",
      name: ".env.example present",
      status: "pass",
      severity: "info",
    });
  }

  return results;
}
