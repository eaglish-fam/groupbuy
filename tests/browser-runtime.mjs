// Shared Playwright lookup for browser tests, so they run on any machine instead of one Mac.
// Order: PLAYWRIGHT_MODULE / CHROME_PATH, the original Codex macOS runtime, then a project or
// global npm install using Playwright's own Chromium. Returns null when no runtime is found.
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const codexModule = '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function globalModules() {
  try { return execFileSync('npm', ['root', '-g'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim(); }
  catch { return ''; }
}

function findModule() {
  if (process.env.PLAYWRIGHT_MODULE) return process.env.PLAYWRIGHT_MODULE;
  if (existsSync(codexModule)) return codexModule;
  const require = createRequire(import.meta.url);
  for (const base of [import.meta.dirname, globalModules()].filter(Boolean)) {
    try { return pathToFileURL(require.resolve('playwright', {paths: [base]})).href; } catch {}
  }
  return '';
}

// Set REQUIRE_BROWSER=1 to fail instead of skipping when no runtime is found.
export async function loadBrowserRuntime() {
  const module = findModule();
  if (!module && process.env.REQUIRE_BROWSER === '1') throw Error('Playwright is required (REQUIRE_BROWSER=1) but was not found');
  if (!module) return null;
  const loaded = await import(module);
  const chromium = loaded.chromium || loaded.default?.chromium;
  const executablePath = process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined);
  return {chromium, executablePath};
}
