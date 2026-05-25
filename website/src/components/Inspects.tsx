// What Repo Doctor actually inspects. Tabular, not card-grid.

interface Inspect {
  id: string;
  subject: string;
  detail: React.ReactNode;
  output: string[];
}

const INSPECTS: Inspect[] = [
  {
    id: "I.01",
    subject: "package.json",
    detail: (
      <>
        Reads the manifest from disk and parses it. A missing file or invalid
        JSON is a <strong>blocker</strong>; everything downstream depends on it.
      </>
    ),
    output: ["pass", "blocker"],
  },
  {
    id: "I.02",
    subject: "Lockfiles",
    detail: (
      <>
        Detects which lockfile is in use — <code>bun.lock</code>,{" "}
        <code>pnpm-lock.yaml</code>, <code>package-lock.json</code>,{" "}
        <code>yarn.lock</code>. Two lockfiles in the same repo is a blocker.
      </>
    ),
    output: ["pass", "blocker"],
  },
  {
    id: "I.03",
    subject: "Scripts",
    detail: (
      <>
        Looks for the four scripts that matter for shipping:{" "}
        <code>build</code>, <code>test</code>, <code>lint</code>,{" "}
        <code>typecheck</code>. Missing ones are warnings, not blockers.
      </>
    ),
    output: ["pass", "warning"],
  },
  {
    id: "I.04",
    subject: "Git state",
    detail: (
      <>
        Confirms a git repository, then runs <code>git status --porcelain</code>{" "}
        to surface uncommitted or untracked files. Clean working tree is the
        signal you want before tagging a release.
      </>
    ),
    output: ["pass", "warning"],
  },
  {
    id: "I.05",
    subject: ".env / .env.example",
    detail: (
      <>
        If <code>.env</code> exists without a matching <code>.env.example</code>,
        flags it. Run <code>repo-doctor init</code> to generate the example with
        values stripped.
      </>
    ),
    output: ["pass", "warning"],
  },
  {
    id: "I.06",
    subject: "Script execution",
    detail: (
      <>
        With <code>--run</code>, invokes the allow-listed scripts via{" "}
        <code>Bun.spawn</code> under a per-script timeout (<code>--timeout</code>,
        default 60s). No postinstall surprises.
      </>
    ),
    output: ["pass", "fail", "timeout"],
  },
];

export function Inspects() {
  return (
    <section className="section" id="inspects">
      <div className="container">
        <div className="section__head">
          <div>
            <div className="section__index">Section&nbsp;II</div>
            <div className="section__rule" aria-hidden="true" />
          </div>
          <div className="section__head-meta">
            <h2 className="section__title">
              What it <em>inspects</em>.
            </h2>
            <p className="section__lede">
              Six narrow checks that quietly break shipping. No deep static
              analysis, no vulnerability database — just the signals that
              actually fail releases.
            </p>
          </div>
        </div>

        <div className="inspects" role="table" aria-label="What Repo Doctor inspects">
          <div className="inspects__header" role="row">
            <div role="columnheader">ID</div>
            <div role="columnheader">Subject</div>
            <div role="columnheader">What it reads / runs</div>
            <div role="columnheader">Possible output</div>
          </div>

          {INSPECTS.map((row) => (
            <div className="inspects__row" role="row" key={row.id}>
              <div className="inspects__cell-id" role="cell">
                {row.id}
              </div>
              <div className="inspects__cell-subject" role="cell">
                {row.subject}
              </div>
              <div className="inspects__cell-detail" role="cell">
                {row.detail}
              </div>
              <div className="inspects__cell-output" role="cell">
                {row.output.map((o) => (
                  <span key={o}>{o}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
