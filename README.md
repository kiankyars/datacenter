# Inside a Datacenter

A full-screen, scroll-driven Three.js field guide to datacenter equipment, inspired by the isometric voxel world at https://y-n10.com.

**Live site:** https://kiankyars.github.io/datacenter/

The site travels through six chapters: overview, power, compute, cooling, network and the people who operate a facility. Scroll to move between chapters, drag sideways (or use the rotate buttons) to turn the view, and select equipment in the world or from each chapter's equipment guide. Arrow keys, Page Up/Down, keys 1–6 and the chapter controls move between stops. The power, cooling and network chapters can trace their paths through the building, and the compute chapter opens a server. Each view has its own address (for example `#power/ups`), so it can be shared.

This is an illustrative mixed air/liquid-cooled facility, not an engineering design or live telemetry. Source links are included in equipment details and the About dialog.

## Run it

```sh
npm install
npm run dev        # http://127.0.0.1:4173/ (set PORT to change it)
```

The site in `dist/` is plain static files with relative URLs, so it can be served from any path. No build step is needed.

## Structure

- `dist/content.js` holds all chapter and equipment copy, and is the only place names, labels and counts are defined.
- `dist/app.js` runs the chapters, drawers, keyboard controls, addresses and the optional WebMCP `explore_datacenter` tool. The copy and controls work before, and without, the 3D world.
- `dist/world.js` builds the voxel landscape and camera. It loads lazily and falls back to a message when WebGL is unavailable.
- `dist/vendor/three-<version>/` is the vendored Three.js build.

Animation follows the reduced-motion preference, including when it changes while the page is open, and ambient motion can be paused.

## Check and test

```sh
npm run check         # syntax, plus the vendored three.js matches node_modules
npm run lint
npm run format:check
npm test              # Playwright smoke tests; needs `npx playwright install chromium`
node tests/screenshots.mjs out/   # screenshots of every chapter at six viewport sizes
```

CI runs all of these on every push, uploads the screenshots as an artifact, and deploys `dist/` to GitHub Pages from `main` when the tests pass.

## Update Three.js

```sh
npm install -D three@<version>
npm run vendor        # copies the build into dist/vendor/three-<version>/
```

Then update the `vendor/three-<version>/` paths in `dist/world.js` and `dist/index.html`; `npm run check` fails until they match.

## License

MIT; see `LICENSE`. Three.js keeps its own MIT license in `dist/vendor/`.
