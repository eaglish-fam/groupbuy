import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const runtime = '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root = new URL('../', import.meta.url);

test('Leofoo video keeps the original 4:3 thumbnail centered in a 16:9 frame and remains keyboard-playable', {timeout: 30_000}, async t => {
  if (!existsSync(runtime)) return t.skip('bundled Playwright is unavailable');
  const {chromium} = await import(runtime);
  const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try {
    const page = await browser.newPage({serviceWorkers: 'block'});
    // Deterministic geometry fixture reproduces hqdefault's 45px letterboxes.
    // No consumer image is generated or edited by this test.
    await page.route('**/hqdefault.jpg', r => r.fulfill({contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><path fill="black" d="M0 0h480v360H0z"/><path fill="#467c8a" d="M0 45h480v270H0z"/></svg>'}));
    await page.route('**/embed/**', r => r.fulfill({contentType: 'text/html', body: '<title>Playback frame fixture</title>'}));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await page.setContent('<main class="article-body"><div id="family-video" class="video-section"></div></main>');
      for (const file of ['product-content.css', 'articles/article.css', 'blog/leofoo/leofoo.css']) {
        await page.addStyleTag({content: readFileSync(new URL(file, root), 'utf8')});
      }
      await page.addScriptTag({path: new URL('product-content.js', root).pathname});
      await page.evaluate(() => ProductContent.mountVideos(document.querySelector('#family-video'), 'https://www.youtube.com/watch?v=i5yGptoSF0M'));
      await page.waitForFunction(() => document.querySelector('.video-poster img')?.naturalWidth === 480);
      const geometry = await page.locator('.video-poster').evaluate(button => {
        const img = button.querySelector('img'), b = button.getBoundingClientRect(), i = img.getBoundingClientRect(), css = getComputedStyle(img);
        const scale = Math.max(i.width / img.naturalWidth, i.height / img.naturalHeight);
        const top = (img.naturalHeight - i.height / scale) / 2;
        return {buttonWidth: b.width, buttonHeight: b.height, imageHeight: i.height, fit: css.objectFit, position: css.objectPosition, sourceTop: top, sourceBottom: img.naturalHeight - top};
      });
      assert.ok(Math.abs(geometry.buttonWidth / geometry.buttonHeight - 16 / 9) < 0.01, `16:9 at ${width}`);
      assert.ok(Math.abs(geometry.imageHeight - geometry.buttonHeight) < 1, `image fills frame at ${width}`);
      assert.equal(geometry.fit, 'cover');
      assert.equal(geometry.position, '50% 50%');
      assert.ok(geometry.sourceTop >= 44.5 && geometry.sourceBottom <= 315.5, `letterboxes outside visible crop at ${width}`);
      await page.locator('.video-poster').focus();
      await page.keyboard.press('Enter');
      const frame = page.locator('#family-video iframe');
      await frame.waitFor();
      assert.match(await frame.getAttribute('src'), /\/embed\/i5yGptoSF0M\?/);
      assert.match(await frame.getAttribute('src'), /autoplay=1/);
      assert.equal(await page.locator('.video-poster').count(), 0);
      assert.equal(await page.locator('#family-video a').getAttribute('href'), 'https://www.youtube.com/watch?v=i5yGptoSF0M');
    }
  } finally {
    await browser.close();
  }
});
