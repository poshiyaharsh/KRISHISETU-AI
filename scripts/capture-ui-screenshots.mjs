import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const headerOutDir = path.resolve(rootDir, 'docs', 'ui', 'header');
const weatherOutDir = path.resolve(rootDir, 'docs', 'ui', 'weather');

fs.mkdirSync(headerOutDir, { recursive: true });
fs.mkdirSync(weatherOutDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const BASE_URL = 'http://localhost:4173';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function main() {
  console.log('Starting Vite preview server...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: path.resolve(rootDir, 'frontend'),
    shell: true,
    stdio: 'ignore',
  });

  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      await wait(500);
    }
  }

  if (!serverReady) {
    previewProcess.kill();
    throw new Error('Preview server did not become ready in time');
  }
  console.log('Preview server ready at', BASE_URL);

  console.log('Launching headless Chrome...');
  const chromeProcess = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  await wait(1500);

  try {
    const versionRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const versionData = await versionRes.json();
    console.log('Connected to Chrome:', versionData['Browser']);

    const newTargetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(BASE_URL)}`, {
      method: 'PUT',
    });
    const targetData = await newTargetRes.json();
    const wsUrl = targetData.webSocketDebuggerUrl;

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    async function captureScreenshot(outPath, width, height, clipHeight = 400) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 1100,
      });

      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: 0,
          width,
          height: clipHeight,
          scale: 1,
        },
      });

      const buffer = Buffer.from(screenshot.data, 'base64');
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved ${outPath}`);
    }

    const widths = [360, 768, 1024, 1100, 1280, 1440, 1920];
    const langs = ['en', 'hi', 'gu'];

    for (const lang of langs) {
      for (const w of widths) {
        // 1. Home header
        const homeUrl = `${BASE_URL}/`;
        await cdp.send('Page.navigate', { url: homeUrl });
        await wait(800);
        await cdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('i18nextLng', '${lang}');
            window.location.reload();
          `,
        });
        await wait(1000);

        const headerFile = path.resolve(headerOutDir, `header-${w}px-${lang}.png`);
        await captureScreenshot(headerFile, w, 800, 160);

        // 2. Weather card
        const weatherUrl = `${BASE_URL}/weather`;
        await cdp.send('Page.navigate', { url: weatherUrl });
        await wait(1200);

        const weatherFile = path.resolve(weatherOutDir, `weather-${w}px-${lang}.png`);
        await captureScreenshot(weatherFile, w, 900, 650);
      }
    }

    // Capture mobile menu open at 360px
    await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
    await wait(800);
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('i18nextLng', 'en');
        window.location.reload();
      `,
    });
    await wait(1000);
    await cdp.send('Runtime.evaluate', {
      expression: `
        const menuBtn = document.querySelector('button[aria-controls="mobile-nav-panel"]');
        if (menuBtn) menuBtn.click();
      `,
    });
    await wait(800);
    const menuOpenPath = path.resolve(headerOutDir, 'header-360px-menu-open.png');
    await captureScreenshot(menuOpenPath, 360, 800, 600);

    cdp.close();
  } finally {
    console.log('Cleaning up processes...');
    chromeProcess.kill();
    previewProcess.kill();
  }

  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
