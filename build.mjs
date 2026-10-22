import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const tpl = read('src/index.template.html');
const css = read('src/styles.css');
const bazi = read('src/bazi.js');
const content = read('src/content.js');
const app = read('src/app.js');
const music = read('src/music.js');

const bgmPath = path.join(root, 'assets/theme.mp3');
const bgm = fs.existsSync(bgmPath) ? fs.readFileSync(bgmPath).toString('base64') : '';

const out = tpl
  .replace('/*STYLE*/', () => css)
  .replace('/*BAZI*/', () => bazi)
  .replace('/*MUSIC*/', () => music)
  .replace('/*CONTENT*/', () => content)
  .replace('/*APP*/', () => app)
  .replace('"@@BGM@@"', () => JSON.stringify(bgm));

fs.writeFileSync(path.join(root, 'index.html'), out);
console.log('built index.html ·', (out.length / 1024).toFixed(1) + ' KB');
