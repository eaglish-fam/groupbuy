import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8778';
const passed = [];
function check(name, result) { assert.ok(result, name); passed.push(name); }
async function settle(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function gotoSection(page, id) {
  await page.locator(`#${id}`).evaluate(el => scrollTo({top:scrollY + el.getBoundingClientRect().top - 72, behavior:'instant'}));
  await settle(page);
}
async function fixture(context) {
  await context.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (u.origin === base) return route.continue();
    if (u.hostname === 'docs.google.com') return route.fulfill({contentType:'text/csv', headers:{'Access-Control-Allow-Origin':'*'}, body:'品牌,連結,類型,開團日期,結束日期\n墾丁凱撒大飯店,https://example.invalid/caesar,長期,,\n'});
    if (u.hostname === 'cdnjs.cloudflare.com') return route.fulfill({contentType:'text/javascript',body:readFileSync(new URL('../design/papaparse.min.js',import.meta.url))});
    if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
    return route.abort(); // No production analytics or outbound purchases during a UI test.
  });
}
try {
  for (const [width,height] of [[390,844],[320,568],[844,390],[1024,768],[1200,800],[1440,900]]) {
    const context = await browser.newContext({viewport:{width,height}, reducedMotion:'reduce', serviceWorkers:'block'});
    await fixture(context);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/blog/caesar-kenting/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.offer-bar.is-floating').waitFor();
    const root = page.locator('.reading-nav'), tab = page.locator('.reading-nav__tab'), panel = page.locator('.reading-nav__panel');
    check(`${width}: no side navigation before reaching original TOC`, await root.isHidden());
    const original = await page.locator('[data-reading-nav] a').evaluateAll(links => links.map(a => [a.hash,a.textContent]));
    assert.deepEqual(await page.locator('.reading-nav__list a').evaluateAll(links => links.map(a => [a.hash,a.textContent])), original);
    await gotoSection(page, 'scenic');
    check(`${width}: navigation appears after original leaves`, await root.isVisible());
    check(`${width}: active section follows reading`, await page.locator('.reading-nav__list a[aria-current]').getAttribute('href') === '#scenic');
    if (width < 1200) {
      check(`${width}: compact accessible trigger`, await tab.isVisible() && await panel.evaluate(el => el.inert));
      await tab.click();
      check(`${width}: drawer opens with accessible links`, await tab.getAttribute('aria-expanded') === 'true' && !await panel.evaluate(el => el.inert));
      check(`${width}: gradient drawer`, await panel.evaluate(el => getComputedStyle(el).backgroundImage.includes('gradient')));
      await page.screenshot({path:`/tmp/caesar-reading-nav-${width}-open.png`});
      await page.keyboard.press('Escape');
      check(`${width}: Escape closes and returns focus`, await tab.getAttribute('aria-expanded') === 'false' && await tab.evaluate(el => document.activeElement === el));
      await tab.click();
    } else {
      check(`${width}: desktop menu visible without opening`, await panel.isVisible() && !await panel.evaluate(el => el.inert) && await tab.isHidden());
      check(`${width}: menu does not cover the article`, await panel.evaluate(el => {
        const body = document.querySelector('.article-body');
        return el.getBoundingClientRect().right + 8 <= body.getBoundingClientRect().left + parseFloat(getComputedStyle(body).paddingLeft);
      }));
    }
    // Every section, including below-fold items in short drawers, remains reachable.
    for (const id of original.map(link => link[0].slice(1))) {
      if (width < 1200 && await tab.getAttribute('aria-expanded') !== 'true') await tab.click();
      await page.locator(`.reading-nav__list a[href="#${id}"]`).click();
      await settle(page);
      check(`${width}: jump ${id} preserves visible heading and URL`, new URL(page.url()).hash === '#' + id && await page.locator(`#${id} h2`).evaluate(el => {
        const r = el.getBoundingClientRect(), chrome = document.querySelector('.journal-chrome').getBoundingClientRect();
        return r.top >= chrome.bottom && r.top < innerHeight;
      }));
      if (width < 1200) check(`${width}: closes after ${id}`, await panel.evaluate(el => el.inert));
    }
    await gotoSection(page,'scenic');
    await page.screenshot({path:`/tmp/caesar-reading-nav-${width}-reading.png`});
    check(`${width}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${width}: purchase CTA still works independently`, await page.locator('.offer-bar.is-floating').isVisible());
    await page.locator('.offer-slot').evaluate(el => el.scrollIntoView({block:'center',behavior:'instant'}));
    await page.waitForFunction(() => !document.querySelector('.offer-bar').classList.contains('is-floating'));
    await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
    await settle(page);
    check(`${width}: original return hides side navigation`, await root.isHidden());
    // Deep links and breakpoint changes must initialize correctly without scrolling first.
    await page.goto(base + '/blog/caesar-kenting/#poolside');
    await settle(page);
    check(`${width}: direct section link initializes navigation`, await root.isVisible());
    await page.setViewportSize({width:width < 1200 ? 1440 : 390,height:844});
    await settle(page);
    check(`${width}: resize preserves correct inert state`, await panel.evaluate(el => el.inert === (innerWidth < 1200)));
    check(`${width}: no runtime errors`, errors.length === 0);
    await context.close();
  }
  for (const width of [390,1440]) {
    const context = await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
    await fixture(context);
    const page = await context.newPage();
    await page.goto(base + '/blog/caesar-kenting/');
    await page.evaluate(() => document.fonts.ready);
    const showSource = async () => {
      await page.locator('[data-reading-nav]').evaluate(el => el.scrollIntoView({block:'center',behavior:'instant'}));
      await settle(page);
    };
    const exitSource = async () => {
      await page.locator('[data-reading-nav]').evaluate(el => scrollTo({top:scrollY + el.getBoundingClientRect().bottom - document.querySelector('.journal-chrome').getBoundingClientRect().bottom,behavior:'instant'}));
      await settle(page);
    };
    await showSource();
    await exitSource();
    const flight = page.locator('.reading-nav__flight');
    check(`${width}: original TOC morphs toward the side`, await flight.count() === 1);
    check(`${width}: moving copy has no interactive or duplicate section identity`, await flight.evaluate(el => el.inert && el.getAttribute('aria-hidden') === 'true' && !el.hasAttribute('data-reading-nav') && !el.querySelector('[id]')));
    const frame = await flight.evaluate(el => {
      const animation = el.getAnimations()[0];
      animation.pause(); animation.currentTime = 300;
      return {frames:animation.effect.getKeyframes(),duration:animation.effect.getTiming().duration};
    });
    check(`${width}: source shrinks and moves in a bounded transition`, frame.duration === 760 && frame.frames.at(-1).transform.includes('scale(') && frame.frames.at(-1).opacity === '0');
    await page.mouse.move(width-5,840);
    await page.screenshot({path:`/tmp/caesar-reading-nav-${width}-morph.png`});
    await flight.evaluate(el => el.getAnimations()[0].play());
    await flight.waitFor({state:'detached'});
    check(`${width}: arrival cleans up its copy`, await flight.count() === 0);
    await showSource(); await exitSource();
    await showSource();
    check(`${width}: reverse scrolling cancels arrival`, await flight.count() === 0 && await page.locator('.reading-nav').isHidden());
    if (width < 1200) {
      await exitSource();
      await page.locator('.reading-nav__tab').click();
      check('Mobile: opening during arrival cancels the copy and opens real navigation', await flight.count() === 0 && await page.locator('.reading-nav__tab').getAttribute('aria-expanded') === 'true');
      await page.keyboard.press('Escape');
      await showSource();
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await exitSource();
    check(`${width}: reduced motion keeps immediate navigation without flight`, await flight.count() === 0 && await page.locator('.reading-nav').isVisible());
    await context.close();
  }
  // Real touch events exercise swipe cancellation and animation, not just synthetic click handlers.
  const touchContext = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  await fixture(touchContext);
  const touchPage = await touchContext.newPage();
  await touchPage.goto(base + '/blog/caesar-kenting/');
  await gotoSection(touchPage,'scenic');
  const touchTab = touchPage.locator('.reading-nav__tab');
  check('Mobile: brief hint animation is enabled', await touchPage.locator('.reading-nav__chevron').evaluate(el => getComputedStyle(el).animationIterationCount === '2'));
  const client = await touchContext.newCDPSession(touchPage);
  const swipe = async (x,y,dx,dy) => {
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=6;i++) await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchPage.waitForTimeout(400);
  };
  let bounds = await touchTab.boundingBox();
  check('Mobile: larger visible 48px target has white gradient and restrained glow', await touchTab.evaluate(el => {
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();
    return rect.width >= 48 && rect.height >= 76 && style.backgroundImage.includes('gradient') && style.boxShadow !== 'none' && parseFloat(style.borderWidth) === 0;
  }));
  check('Mobile: four characters form one upright vertical column', await touchPage.locator('.reading-nav__tab-label').evaluate(el => {
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();
    return style.writingMode === 'vertical-rl' && style.textOrientation === 'upright' && style.whiteSpace === 'nowrap' && rect.height > rect.width * 3;
  }));
  await swipe(10,bounds.y+25,95,0);
  check('Mobile: right swipe opens the drawer', await touchTab.getAttribute('aria-expanded') === 'true');
  await swipe(220,400,-95,0);
  check('Mobile: left swipe closes the drawer', await touchTab.getAttribute('aria-expanded') === 'false');
  await touchTab.tap();
  await touchPage.waitForTimeout(350);
  await touchPage.locator('.reading-nav__list a[href="#poolside"]').tap();
  await touchPage.waitForFunction(() => Math.abs(document.querySelector('#poolside').getBoundingClientRect().top + parseFloat(getComputedStyle(document.querySelector('#poolside')).paddingTop) - document.querySelector('.journal-chrome').getBoundingClientRect().bottom - 16) < 3);
  check('Mobile: smooth animated jump reaches poolside', new URL(touchPage.url()).hash === '#poolside');
  await touchTab.tap();
  await touchPage.waitForTimeout(350);
  await touchPage.locator('.reading-nav__shade').tap({position:{x:360,y:250}});
  check('Mobile: outside tap closes drawer', await touchTab.getAttribute('aria-expanded') === 'false');
  await touchPage.waitForTimeout(350);
  check('Mobile: drawer finishes closing visually', await touchPage.locator('.reading-nav__panel').isHidden());
  await touchPage.screenshot({path:'/tmp/caesar-reading-nav-touch-closed.png'});
  await touchPage.setViewportSize({width:390,height:568});
  await touchTab.tap();
  await touchPage.waitForTimeout(350);
  await touchPage.locator('.reading-nav__list').evaluate(el => { el.scrollTop=0; });
  await swipe(140,370,0,-120);
  check('Mobile: vertical swipe scrolls the short drawer without closing', await touchTab.getAttribute('aria-expanded') === 'true' && await touchPage.locator('.reading-nav__list').evaluate(el => el.scrollTop > 30));
  await touchContext.close();
  // No-JS readers keep the original navigable document.
  const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await fixture(context);
  const page = await context.newPage();
  await page.goto(base + '/blog/caesar-kenting/');
  check('No JS: all eleven anchor links survive', await page.locator('[data-reading-nav] a').count() === 11 && await page.locator('.reading-nav').count() === 0);
  await context.close();
  console.log(JSON.stringify({passed:passed.length, checks:passed},null,2));
} finally { await browser.close(); }
