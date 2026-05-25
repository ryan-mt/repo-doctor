interface Check {
  id: string;
  name: string;
  note?: string;
}

interface InspectionReportProps {
  repoName: string;
  date: string;
  scanTime: string;
  score: number;
  status: string;
  stamp: { main: string; sub: string };
  warnings: Check[];
  passed: Check[];
  signatureHash: string;
}

export function InspectionReport({
  repoName,
  date,
  scanTime,
  score,
  status,
  stamp,
  warnings,
  passed,
  signatureHash,
}: InspectionReportProps) {
  return (
    <article className="report" id="report" aria-label="Sample inspection report">
      <div className="report__masthead">
        <div className="report__masthead-title">Repository Inspection Report</div>
        <div className="report__masthead-id">FORM&nbsp;RD&#8209;01&nbsp;/&nbsp;REV&nbsp;A</div>
      </div>

      <div className="report__meta">
        <div className="report__meta-cell">
          <span className="report__meta-key">Repository</span>
          <span className="report__meta-val">{repoName}</span>
        </div>
        <div className="report__meta-cell">
          <span className="report__meta-key">Date</span>
          <span className="report__meta-val">{date}</span>
        </div>
        <div className="report__meta-cell">
          <span className="report__meta-key">Scan time</span>
          <span className="report__meta-val">{scanTime}</span>
        </div>
        <div className="report__meta-cell">
          <span className="report__meta-key">Mode</span>
          <span className="report__meta-val">scan&nbsp;&minus;&minus;ci</span>
        </div>
      </div>

      <div className="report__score">
        <div>
          <div className="report__score-label">Composite score</div>
          <div className="report__score-figure">
            <span className="report__score-num">{score}</span>
            <span className="report__score-denom">/100</span>
          </div>
          <div className="report__score-status">{status}</div>
        </div>
        <div className="report__stamp" aria-hidden="true">
          <span className="report__stamp-main">{stamp.main}</span>
          <span className="report__stamp-sub">{stamp.sub}</span>
        </div>
      </div>

      {warnings.length > 0 && (
        <section className="report__section">
          <header className="report__section-head">
            <span className="report__section-label report__section-label--warn">
              Warnings
            </span>
            <span className="report__section-count">
              {warnings.length.toString().padStart(2, "0")} issue
              {warnings.length === 1 ? "" : "s"}
            </span>
          </header>
          <ul className="report__checks">
            {warnings.map((c) => (
              <li className="report__check report__check--warn" key={c.id}>
                <span className="report__check-id">{c.id}</span>
                <span className="report__check-mark" aria-hidden="true">!</span>
                <span className="report__check-name">{c.name}</span>
                {c.note && <span className="report__check-note">{c.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="report__section">
        <header className="report__section-head">
          <span className="report__section-label">Passed checks</span>
          <span className="report__section-count">
            {passed.length.toString().padStart(2, "0")} of{" "}
            {(passed.length + warnings.length).toString().padStart(2, "0")}
          </span>
        </header>
        <ul className="report__checks">
          {passed.map((c) => (
            <li className="report__check report__check--pass" key={c.id}>
              <span className="report__check-id">{c.id}</span>
              <span className="report__check-mark" aria-hidden="true">&#10003;</span>
              <span className="report__check-name">{c.name}</span>
              {c.note && <span className="report__check-note">{c.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <footer className="report__signature">
        <span>Signed&nbsp;/&nbsp;repo&#8209;doctor</span>
        <span className="report__signature-hash">{signatureHash}</span>
      </footer>
    </article>
  );
}
