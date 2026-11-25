import Link from "next/link";
import { projects, type Project, type ProjectTier } from "@/data/projects";
import { OfficeScene } from "@/components/office/OfficeScene";
import geometry from "../../public/office/geometry.json";
import "./office.css";

const COPY = {
  stage: "A tabletop scale model of a busy open-plan office",
  kicker: "Joseph Wibowo",
  title: "What I’m building",
  tiers: { current: "Now building", selected: "Selected work", archive: "From the archive" },
  demo: "Watch the demo",
  stamp: "Archived",
  number: "No.",
  close: "Close projects",
} as const;

const ROOT_ID = "office";

/** Newest first within a tier; projects of the same year keep the source's order. */
function inTier(tier: ProjectTier): Project[] {
  return projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.tier === tier)
    .sort((a, b) => b.p.year - a.p.year || a.i - b.i)
    .map(({ p }) => p);
}

/** Catalogue numbers count up in the order the work was made: the oldest project is No. 01. */
function catalogueNumber(project: Project): string {
  const chronological = projects
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.year - b.p.year || b.i - a.i)
    .map(({ p }) => p);
  return `${COPY.number} ${String(chronological.indexOf(project) + 1).padStart(2, "0")}`;
}

/** An exhibit's one line: its description up to the first colon, dash or full stop. */
function oneLine(project: Project): string {
  return `${project.description.split(/:\s| — |\.\s/)[0].replace(/\.$/, "")}.`;
}

function ProjectLink({ project, className, children }: { project: Project; className?: string; children: React.ReactNode }) {
  if (project.external) {
    return (
      <a href={project.link} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={`/projects/${project.slug}`} className={className}>
      {children}
    </Link>
  );
}

function Miniature({ project }: { project: Project }) {
  if (!project.miniature) return null;
  // A plain <img>: the file is a pre-sized WebP in public/office/, loaded relative to this page so it works under any
  // base path (next/image would need the base path spelled out).
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="mini" src={project.miniature.src} alt={project.miniature.alt} width={720} height={540} decoding="async" />;
}

const Arrow = () => <span aria-hidden="true">→</span>;

export default function Home() {
  const current = inTier("current");
  const selected = inTier("selected");
  const archive = inTier("archive");
  const stoke = current[0];
  if (!stoke) throw new Error("projects.ts has no current project");
  const years = archive.map((p) => p.year);
  const lo = Math.min(...years);
  const hi = Math.max(...years);

  return (
    <div id={ROOT_ID} className="office">
      <div className="scrim" aria-hidden="true" />
      <header className="intro">
        <h1>Joseph Wibowo</h1>
        <p className="tagline">Builder overwhelmed at the possibilities</p>
        <p className="now">
          Building <a href={stoke.link}>{stoke.title}</a>, a personal finance&nbsp;app.
        </p>
        <nav aria-label="Elsewhere">
          <ul>
            <li>
              <button className="projects-btn" type="button" data-open-projects aria-haspopup="dialog" aria-controls="projects">
                Projects <Arrow />
              </button>
            </li>
            <li>
              <a href="https://github.com/josephwibowo" rel="me">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/josephwibowo" rel="me">
                LinkedIn
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main id="viewport">
        <div id="stage" role="group" aria-label={COPY.stage}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the still the whole scene is drawn on; relative, like the scene's layers */}
          <img id="plate" src={`office/${geometry.stage.plate}`} alt="" width={geometry.stage.w} height={geometry.stage.h} fetchPriority="high" />
        </div>
      </main>

      <dialog id="projects" aria-labelledby="projects-title">
        <button className="close" type="button" aria-label={COPY.close}>
          ×
        </button>
        <div className="sheet">
          <div className="page">
            <p className="cat-kicker">{COPY.kicker}</p>
            <h2 id="projects-title">{COPY.title}</h2>

            <section className="tier" aria-labelledby="tier-current-title">
              {current.map((p) => (
                <div className="now-entry" key={p.slug}>
                  <Miniature project={p} />
                  <div className="words">
                    <h3 className="tier-label" id="tier-current-title">
                      {COPY.tiers.current}
                    </h3>
                    <h4>{p.title}</h4>
                    <p>{p.description}</p>
                    <a className="cta" href={p.link}>
                      {p.linkLabel ?? `Visit ${p.title}`} <Arrow />
                    </a>
                  </div>
                </div>
              ))}
            </section>

            <section className="tier" aria-labelledby="tier-selected-title">
              <h3 className="tier-label" id="tier-selected-title">
                {COPY.tiers.selected}
              </h3>
              <ul className="exhibits">
                {selected.map((p) => (
                  <li className="exhibit" key={p.slug}>
                    <Miniature project={p} />
                    <p className="no">{catalogueNumber(p)}</p>
                    <h4>
                      <ProjectLink project={p}>{p.title}</ProjectLink>
                    </h4>
                    <p className="year">{p.year}</p>
                    <p className="line">{oneLine(p)}</p>
                    {p.award && <p className="award">{p.award}</p>}
                    {p.demo && (
                      <a className="demo" href={p.demo}>
                        {COPY.demo}
                        <span className="vh">: {p.title}</span> <Arrow />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="tier" aria-labelledby="tier-archive-title">
              <h3 className="tier-label" id="tier-archive-title">
                {COPY.tiers.archive} · <span className="range">{lo === hi ? lo : `${lo}–${hi}`}</span>
              </h3>
              <ul className="cards">
                {archive.map((p) => (
                  <li className="card" key={p.slug}>
                    <p className="typed">
                      <ProjectLink project={p}>{p.title}</ProjectLink>
                      <span className="year">{p.year}</span>
                    </p>
                    <span className="stamp">{COPY.stamp}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </dialog>

      <OfficeScene rootId={ROOT_ID} />
    </div>
  );
}
