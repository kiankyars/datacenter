// Copies the installed three.js build into dist/vendor/three-<version>/, or with
// --check verifies that the shipped copy matches the installed package byte for byte.
import { cp, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('node_modules/three/package.json', root), 'utf8'));
const target = new URL(`dist/vendor/three-${version}/`, root);
const files = [
  ['node_modules/three/build/three.module.min.js', 'three.module.min.js'],
  ['node_modules/three/build/three.core.min.js', 'three.core.min.js'],
  ['node_modules/three/LICENSE', 'LICENSE.txt'],
];

if (process.argv.includes('--check')) {
  const problems = [];
  for (const [from, to] of files) {
    const shipped = await readFile(new URL(to, target)).catch(() => null);
    if (!shipped) problems.push(`missing dist/vendor/three-${version}/${to}`);
    else if (!shipped.equals(await readFile(new URL(from, root))))
      problems.push(`dist/vendor/three-${version}/${to} differs from ${from}`);
  }
  for (const source of ['dist/world.js', 'dist/index.html']) {
    const text = await readFile(new URL(source, root), 'utf8');
    if (!text.includes(`vendor/three-${version}/`))
      problems.push(`${source} does not reference vendor/three-${version}/`);
  }
  if (problems.length) {
    console.error(`Vendored three.js is out of date. Run npm run vendor.\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Vendored three.js ${version} matches node_modules.`);
} else {
  await mkdir(target, { recursive: true });
  for (const [from, to] of files) await cp(new URL(from, root), new URL(to, target));
  console.log(
    `Copied three.js ${version} to ${fileURLToPath(target)}. Update the import paths if the version changed.`,
  );
}
