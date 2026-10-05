// Copies the installed three.js build into dist/vendor/three-<version>/ and removes older
// copies, or with --check verifies that the shipped copy matches the installed package
// byte for byte and that every reference points at it.
import { cp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('node_modules/three/package.json', root), 'utf8'));
const folder = `three-${version}`;
const target = new URL(`dist/vendor/${folder}/`, root);
const files = [
  ['node_modules/three/build/three.module.min.js', 'three.module.min.js'],
  ['node_modules/three/build/three.core.min.js', 'three.core.min.js'],
  ['node_modules/three/LICENSE', 'LICENSE.txt'],
];
const otherCopies = async () =>
  (await readdir(new URL('dist/vendor/', root))).filter((name) => name.startsWith('three-') && name !== folder);

if (process.argv.includes('--check')) {
  const problems = [];
  for (const [from, to] of files) {
    const shipped = await readFile(new URL(to, target)).catch(() => null);
    if (!shipped) problems.push(`missing dist/vendor/${folder}/${to}`);
    else if (!shipped.equals(await readFile(new URL(from, root))))
      problems.push(`dist/vendor/${folder}/${to} differs from ${from}`);
  }
  for (const source of ['dist/world.js', 'dist/index.html']) {
    const text = await readFile(new URL(source, root), 'utf8');
    const versions = [...text.matchAll(/vendor\/three-([^/"']+)\//g)].map((m) => m[1]);
    if (!versions.length) problems.push(`${source} does not reference vendor/${folder}/`);
    for (const v of versions) if (v !== version) problems.push(`${source} still references vendor/three-${v}/`);
  }
  for (const name of await otherCopies()) problems.push(`dist/vendor/${name}/ is an old copy`);
  if (problems.length) {
    console.error(
      `Vendored three.js is out of date. Run npm run vendor and update the paths.\n- ${problems.join('\n- ')}`,
    );
    process.exit(1);
  }
  console.log(`Vendored three.js ${version} matches node_modules.`);
} else {
  await mkdir(target, { recursive: true });
  for (const [from, to] of files) await cp(new URL(from, root), new URL(to, target));
  for (const name of await otherCopies()) {
    await rm(new URL(`dist/vendor/${name}/`, root), { recursive: true });
    console.log(`Removed the old copy dist/vendor/${name}/.`);
  }
  console.log(
    `Copied three.js ${version} to ${fileURLToPath(target)}. Update the vendor/three-<version>/ paths in dist/world.js and dist/index.html if the version changed.`,
  );
}
