// Command reference table. Code on the left, plain-English on the right.

interface CmdToken {
  text: string;
  kind?: "flag" | "dim";
}

interface Cmd {
  tokens: CmdToken[];
  desc: string;
}

const CMDS: Cmd[] = [
  {
    tokens: [{ text: "repo-doctor" }],
    desc: "Scan the current directory. Same as scan, the default subcommand.",
  },
  {
    tokens: [{ text: "repo-doctor scan" }],
    desc: "Run all checks and print a sectioned, colored report.",
  },
  {
    tokens: [
      { text: "repo-doctor scan " },
      { text: "--json", kind: "flag" },
    ],
    desc: "Print the report as JSON. No ANSI. Pipe to jq or store as an artifact.",
  },
  {
    tokens: [
      { text: "repo-doctor scan " },
      { text: "--ci", kind: "flag" },
    ],
    desc: "Exit non-zero if any blocker fails. Warnings still pass.",
  },
  {
    tokens: [
      { text: "repo-doctor scan " },
      { text: "--run", kind: "flag" },
      { text: " " },
      { text: "--timeout=60", kind: "flag" },
    ],
    desc:
      "Also run the allow-listed scripts (typecheck, test, lint, build) with a per-script timeout in seconds.",
  },
  {
    tokens: [{ text: "repo-doctor init" }],
    desc: "Write a .env.example from your existing .env (values stripped).",
  },
  {
    tokens: [{ text: "repo-doctor " }, { text: "--help", kind: "flag" }],
    desc: "Show the help text.",
  },
  {
    tokens: [{ text: "repo-doctor " }, { text: "--version", kind: "flag" }],
    desc: "Print the installed version and exit.",
  },
];

export function Commands() {
  return (
    <section className="section" id="commands">
      <div className="container">
        <div className="section__head">
          <div>
            <div className="section__index">Section&nbsp;III</div>
            <div className="section__rule" aria-hidden="true" />
          </div>
          <div className="section__head-meta">
            <h2 className="section__title">
              Every command, <em>one page</em>.
            </h2>
            <p className="section__lede">
              There is no docs site to dig through. These are all of them.
            </p>
          </div>
        </div>

        <div className="cmds" role="table" aria-label="Command reference">
          {CMDS.map((cmd, i) => (
            <div className="cmd-row" role="row" key={i}>
              <code className="cmd-row__code">
                {cmd.tokens.map((t, j) => {
                  if (t.kind === "flag")
                    return (
                      <span key={j} className="flag">
                        {t.text}
                      </span>
                    );
                  if (t.kind === "dim")
                    return (
                      <span key={j} className="dim">
                        {t.text}
                      </span>
                    );
                  return <span key={j}>{t.text}</span>;
                })}
              </code>
              <div className="cmd-row__desc">{cmd.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
