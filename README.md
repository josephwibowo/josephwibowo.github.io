# josephwibowo.github.io

Joseph Wibowo's personal site: one page, a living tabletop scale model of an office. A still photograph is animated as
an 8 fps stop-motion cinemagraph, and Joseph, one figure among many, opens a catalogue of what he's building.

- `src/app/page.tsx`: the page: intro, the stage and the projects catalogue, server-rendered from `src/data/projects.ts`.
- `src/components/office/scene.ts`: the animation, spotlight and dialog behaviour, driven by `public/office/geometry.json`.
- `public/office/`: the plate, pose patches, screen masks and catalogue miniatures, exported from the art-direction kit.

```bash
npm run dev
```

```bash
npm run build
```

`npm run build` writes the static site to `out/`. Pushing to `master` deploys it to GitHub Pages through
`.github/workflows/deploy.yml`.
