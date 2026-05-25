import { GithubIcon, NpmIcon } from "./Icons";

interface NavProps {
  version: string;
  githubUrl: string;
  npmUrl: string;
}

export function Nav({ version, githubUrl, npmUrl }: NavProps) {
  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <a className="nav__brand" href="#top" aria-label="Repo Doctor home">
            <span className="nav__brand-mark" aria-hidden="true">
              +
            </span>
            <span className="nav__brand-name">repo&#8209;doctor</span>
            <span className="nav__brand-id">v{version}</span>
          </a>
          <nav className="nav__links" aria-label="Primary">
            <a className="nav__link nav__link--text" href="#report">
              Report
            </a>
            <a className="nav__link nav__link--text" href="#inspects">
              Inspects
            </a>
            <a className="nav__link nav__link--text" href="#commands">
              Commands
            </a>
            <a className="nav__link nav__link--text" href="#ci">
              CI
            </a>
            <a className="nav__link nav__link--text" href="#limits">
              Limits
            </a>
            <a
              className="nav__link nav__link--icon"
              href={npmUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="npm package"
            >
              <NpmIcon />
            </a>
            <a
              className="nav__link nav__link--icon"
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <GithubIcon />
            </a>
          </nav>
        </div>
      </header>
      <div className="docline" aria-hidden="true">
        <div className="container docline__inner">
          <span>
            File <b>RD&#8209;001</b>
          </span>
          <span>
            Class <b>Repository inspection</b>
          </span>
          <span>
            Issued <b>2026 / 05 / 25</b>
          </span>
          <span>
            Examiner <b>repo&#8209;doctor v{version}</b>
          </span>
          <span>
            Status <b>OPEN</b>
          </span>
        </div>
      </div>
    </>
  );
}
