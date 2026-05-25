import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Inspects } from "./components/Inspects";
import { Commands } from "./components/Commands";
import { Limitations } from "./components/Limitations";
import { CIExample } from "./components/CIExample";
import { Footer } from "./components/Footer";

// Source-of-truth project metadata. Keep in sync with the CLI's package.json.
const META = {
  version: "0.1.0",
  installCommand: "bunx repo-doctor@latest",
  githubUrl: "https://github.com/ryan-mt/repo-doctor",
  npmUrl: "https://www.npmjs.com/package/repo-doctor",
} as const;

export function App() {
  return (
    <>
      <Nav
        version={META.version}
        githubUrl={META.githubUrl}
        npmUrl={META.npmUrl}
      />
      <main>
        <Hero
          installCommand={META.installCommand}
          githubUrl={META.githubUrl}
          npmUrl={META.npmUrl}
        />
        <Inspects />
        <Commands />
        <CIExample />
        <Limitations />
      </main>
      <Footer
        version={META.version}
        githubUrl={META.githubUrl}
        npmUrl={META.npmUrl}
      />
    </>
  );
}
