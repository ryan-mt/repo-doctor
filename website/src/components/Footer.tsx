interface FooterProps {
  githubUrl: string;
  npmUrl: string;
  version: string;
}

export function Footer({ githubUrl, npmUrl, version }: FooterProps) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            Repo&nbsp;<em>Doctor</em>
          </div>
          <div className="footer__links">
            <a
              className="footer__link"
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              className="footer__link"
              href={npmUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
            <a
              className="footer__link"
              href={`${githubUrl}/issues`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Issues
            </a>
          </div>
        </div>

        <div className="footer__meta">
          <span>
            <b>repo&#8209;doctor v{version}</b> &middot; MIT license
          </span>
          <span>Form&nbsp;RD&#8209;01 &middot; Rev&nbsp;A</span>
          <span>End&nbsp;of&nbsp;report</span>
        </div>
      </div>
    </footer>
  );
}
