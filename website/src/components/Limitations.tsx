// Honest scope. Listed prominently, not hidden.

interface Limit {
  text: React.ReactNode;
}

const LIMITS: Limit[] = [
  {
    text: (
      <>
        <strong>Does not prove your code is bug-free.</strong> It checks
        structural signals, not behavior.
      </>
    ),
  },
  {
    text: (
      <>
        <strong>No deep AST or static analysis.</strong> If you need to lint
        bodies of functions, reach for a real linter.
      </>
    ),
  },
  {
    text: (
      <>
        <strong>Does not replace your real checks.</strong> Tests, typecheck,
        lint, and build still have to run. Repo Doctor just confirms they exist.
      </>
    ),
  },
  {
    text: (
      <>
        <strong>No vulnerability scanning.</strong> No advisory DB lookups, no
        SBOM output — use{" "}
        <code>npm audit</code>, <code>osv-scanner</code>, or similar.
      </>
    ),
  },
  {
    text: (
      <>
        <strong>Monorepo support is limited.</strong> Workspace traversal is
        not implemented yet; runs against the root manifest only.
      </>
    ),
  },
  {
    text: (
      <>
        <strong>Lockfile checks are shallow.</strong> Verifies presence and
        uniqueness, not checksum integrity against <code>node_modules</code>.
      </>
    ),
  },
];

export function Limitations() {
  return (
    <section className="section" id="limits">
      <div className="container">
        <div className="section__head">
          <div>
            <div className="section__index">Section&nbsp;V</div>
            <div className="section__rule" aria-hidden="true" />
          </div>
          <div className="section__head-meta">
            <h2 className="section__title">
              What it <em>does not</em> do.
            </h2>
            <p className="section__lede">
              Listed up front so you can decide quickly whether Repo Doctor
              fills the gap you have, or whether you need a different tool —
              run alongside this one.
            </p>
          </div>
        </div>

        <ul className="limits" aria-label="Non-goals">
          {LIMITS.map((l, i) => (
            <li className="limit" key={i}>
              <span className="limit__mark" aria-hidden="true">
                &times;
              </span>
              <span className="limit__text">{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
