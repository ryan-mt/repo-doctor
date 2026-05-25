// CI behavior. Compact failed-run receipt + exit-code reference.

export function CIExample() {
  return (
    <section className="section" id="ci">
      <div className="container">
        <div className="section__head">
          <div>
            <div className="section__index">Section&nbsp;IV</div>
            <div className="section__rule" aria-hidden="true" />
          </div>
          <div className="section__head-meta">
            <h2 className="section__title">
              One line in your <em>pipeline</em>.
            </h2>
            <p className="section__lede">
              Run it on every push. Block merges on broken package state — not
              on cosmetic warnings.
            </p>
          </div>
        </div>

        <div className="ci">
          <article
            className="ci-report"
            aria-label="Example failing CI run"
          >
            <header className="ci-report__head">
              <span>job&nbsp;/&nbsp;ubuntu-latest&nbsp;/&nbsp;node20</span>
              <span className="ci-report__head-status">FAIL</span>
            </header>
            <div className="ci-report__cmd">
              <span className="ci-report__cmd-prompt">$</span>
              <span>
                bunx repo-doctor scan{" "}
                <span style={{ color: "var(--stamp)" }}>--ci</span>
              </span>
            </div>
            <div className="ci-report__exit">
              <span className="ci-report__exit-code">exit&nbsp;1</span>
              <span>not ready to deploy — score&nbsp;62/100</span>
              <span className="ci-report__exit-time">1.8s</span>
            </div>

            <section className="ci-report__section ci-report__section--fail">
              <div className="ci-report__section-label">Blockers&nbsp;·&nbsp;2</div>
              <div className="ci-report__item ci-report__item--fail">
                <span className="ci-report__item-mark">!</span>
                <span>
                  package.json invalid
                  <span className="ci-report__item-note">
                    JSON parse error at line 14, col 3
                  </span>
                </span>
              </div>
              <div className="ci-report__item ci-report__item--fail">
                <span className="ci-report__item-mark">!</span>
                <span>
                  lockfile mismatch
                  <span className="ci-report__item-note">
                    bun.lock and package-lock.json both present
                  </span>
                </span>
              </div>
            </section>

            <section className="ci-report__section ci-report__section--warn">
              <div className="ci-report__section-label">Warnings&nbsp;·&nbsp;1</div>
              <div className="ci-report__item ci-report__item--warn">
                <span className="ci-report__item-mark">~</span>
                <span>no test script found</span>
              </div>
            </section>
          </article>

          <ul className="ci__list">
            <li>
              <code className="ci__code ci__code--pass">exit&nbsp;0</code>
              <span>
                No blockers. The job succeeds; warnings still print to the log so
                reviewers can see them.
              </span>
            </li>
            <li>
              <code className="ci__code ci__code--fail">exit&nbsp;1</code>
              <span>
                At least one blocker. The job fails and your merge is gated.
              </span>
            </li>
            <li>
              <code className="ci__code ci__code--warn">--json</code>
              <span>
                Add <code>--json</code> alongside <code>--ci</code> to capture the
                report as a structured artifact for later inspection.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
