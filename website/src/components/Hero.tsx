import { useState } from "react";
import { InspectionReport } from "./InspectionReport";
import { GithubIcon, NpmIcon, ArrowIcon } from "./Icons";

interface HeroProps {
  installCommand: string;
  githubUrl: string;
  npmUrl: string;
}

export function Hero({ installCommand, githubUrl, npmUrl }: HeroProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__left">
          <div className="hero__fileno">
            <span>
              Section <b>I</b>
            </span>
            <span>Patient&nbsp;intake</span>
            <span className="hero__fileno-rule" aria-hidden="true" />
          </div>

          <h1 className="hero__title">
            Check your repo
            <br />
            before it{" "}
            <em>
              <span className="stamp-underline">ships.</span>
            </em>
          </h1>

          <p className="hero__sub">
            Repo Doctor is a Bun-first CLI that scans <code>package.json</code>,
            lockfiles, scripts, git status, env files, and CI readiness signals —
            and prints one short, honest diagnostic.
          </p>

          <div className="hero__install" role="group" aria-label="Install">
            <span className="hero__install-prompt" aria-hidden="true">$</span>
            <code className="hero__install-cmd">{installCommand}</code>
            <button
              type="button"
              className="hero__install-copy"
              onClick={copy}
              data-copied={copied || undefined}
              aria-label={copied ? "Copied" : "Copy install command"}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="hero__ctas">
            <a
              className="btn-link"
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="btn-link__icon" />
              Source on GitHub
              <ArrowIcon className="btn-link__icon" />
            </a>
            <a
              className="btn-link"
              href={npmUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NpmIcon className="btn-link__icon" />
              npm package
              <ArrowIcon className="btn-link__icon" />
            </a>
          </div>
        </div>

        <div className="hero__right">
          <InspectionReport
            repoName="acme/webapp"
            date="2026-05-25"
            scanTime="142 ms"
            score={83}
            status="Ready with warnings."
            stamp={{ main: "Ready with warnings", sub: "Pre-flight clearance" }}
            warnings={[
              {
                id: "RD-007",
                name: "uncommitted changes",
                note: "2 files modified or untracked",
              },
            ]}
            passed={[
              { id: "RD-001", name: "package.json found" },
              { id: "RD-002", name: "lockfile detected", note: "bun.lock" },
              { id: "RD-003", name: "build script exists" },
              { id: "RD-004", name: "test script exists" },
              { id: "RD-005", name: "lint script exists" },
              { id: "RD-006", name: "typecheck script exists" },
              { id: "RD-008", name: "git repository detected" },
              { id: "RD-009", name: ".env.example present" },
            ]}
            signatureHash="sha1 · 0x9af3c1e"
          />
        </div>
      </div>
    </section>
  );
}
