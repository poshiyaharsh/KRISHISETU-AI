import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'docs', 'ui', 'header');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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

  // Wait for preview server to be ready
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

    // Create a new target / page
    const newTargetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(BASE_URL)}`, {
      method: 'PUT',
    });
    const targetData = await newTargetRes.json();
    const wsUrl = targetData.webSocketDebuggerUrl;

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    async function capture(name, width, height, setupFn) {
      console.log(`Capturing ${name} (${width}x${height})...`);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 1024,
      });
      await cdp.send('Page.navigate', { url: BASE_URL });
      await wait(1000);

      if (setupFn) {
        await setupFn(cdp);
        await wait(500);
      }

      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: 0,
          y: 0,
          width,
          height: height || 400,
          scale: 1,
        },
      });

      const buffer = Buffer.from(screenshot.data, 'base64');
      const outPath = path.resolve(outDir, `${name}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved ${outPath}`);
    }

    // 1. Desktop 1280px (English)
    await capture('header-1280px-en', 1280, 200);

    // 2. Tablet 768px (English)
    await capture('header-768px-en', 768, 200);

    // 3. Mobile 360px (English)
    await capture('header-360px-en', 360, 200);

    // 4. Mobile 360px (Hindi)
    await capture('header-360px-hi', 360, 200, async (client) => {
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('i18nextLng', 'hi');
          window.location.reload();
        `,
      });
      await wait(1200);
    });

    // 5. Mobile 360px (Urdu RTL)
    await capture('header-360px-ur-rtl', 360, 200, async (client) => {
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('i18nextLng', 'ur');
          window.location.reload();
        `,
      });
      await wait(1200);
    });

    // 6. Mobile 360px with Mobile Menu Open
    await capture('header-360px-menu-open', 360, 600, async (client) => {
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('i18nextLng', 'en');
          window.location.reload();
        `,
      });
      await wait(1000);
      await client.send('Runtime.evaluate', {
        expression: `
          const menuBtn = document.querySelector('button[aria-controls="mobile-nav-panel"]');
          if (menuBtn) menuBtn.click();
        `,
      });
      await wait(600);
    });

    cdp.close();
  } finally {
    console.log('Cleaning up processes...');
    chromeProcess.kill();
    previewProcess.kill();
  }

  console.log('All header screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error in capture script:', err);
  process.exit(1);
});
