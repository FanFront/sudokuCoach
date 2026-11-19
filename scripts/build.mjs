import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const source = new URL('../web/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
const sourcePath = fileURLToPath(source);
const files = (await readdir(source, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => join(entry.parentPath, entry.name))
  .sort();

const fingerprint = createHash('sha256');
for (const file of files) {
  const bytes = await readFile(file);
  fingerprint.update(relative(sourcePath, file).split(sep).join('/'));
  fingerprint.update(':');
  fingerprint.update(String(bytes.length));
  fingerprint.update(':');
  fingerprint.update(bytes);
}
const assetPath = `assets/${fingerprint.digest('hex').slice(0, 16)}/`;
const index = await readFile(new URL('index.html', source), 'utf8');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, new URL(assetPath, output), {
  recursive: true,
  filter: path => relative(sourcePath, path) !== 'index.html'
});
// Keep each release's module graph together, including relative imports and workers.
await writeFile(new URL('index.html', output), index.replace(/((?:src|href)=")\.\//g, `$1./${assetPath}`));
