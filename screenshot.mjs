import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
await page.goto(`file://${path.join(__dirname, 'affiche-instagram.html')}`, { waitUntil: 'networkidle0' });
await page.screenshot({ path: path.join(__dirname, 'affiche-speakup-instagram.png'), type: 'png' });
await browser.close();
console.log('Done!');
