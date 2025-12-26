import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = process.env.ATLAS_DEBUG_PORT ?? "4173";
const HOST = process.env.ATLAS_DEBUG_HOST ?? "127.0.0.1";
const url = `http://${HOST}:${PORT}/atlas`;

function startPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "preview", "--", "--host", HOST, "--port", PORT], {
      stdio: "pipe",
      shell: true,
    });

    const onData = (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      if (text.includes(`http://${HOST}:${PORT}`)) {
        child.stdout.off("data", onData);
        resolve(child);
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", (chunk) => process.stderr.write(chunk.toString()));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Preview server exited with code ${code}`));
      }
    });
  });
}

const server = await startPreview();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  console.log(`[console:${msg.type()}] ${msg.text()}`);
});

page.on("pageerror", (error) => {
  console.error(`[pageerror] ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
});

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const screenshotPath = `atlas-debug-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
