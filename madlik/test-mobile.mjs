import { chromium } from '../lib/vscode/node_modules/playwright/index.mjs';
import { expect } from '../lib/vscode/node_modules/@playwright/test/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const workspace = path.join(root, '.madlik/workspace');
const base = 'http://127.0.0.1:18110';
const url = base + '/?folder=' + encodeURIComponent(workspace);
await mkdir('.madlik/screenshots', { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];
let currentPage;
const partId = { files: 'workbench.parts.sidebar', git: 'workbench.parts.sidebar', editor: 'workbench.parts.editor', terminal: 'workbench.parts.panel' };

async function load(context, viewport) {
  const page = await context.newPage();
  currentPage = page;
  page.setDefaultTimeout(15000);
  await page.setViewportSize(viewport);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('.monaco-workbench').waitFor({ timeout: 60000 });
  await expect(page.locator('.monaco-workbench')).toHaveClass(/vs-dark/, {timeout:60000});
  if (viewport.width <= 768) {
    await expect(page.locator('.madlik-mobile-navigation')).toBeVisible({timeout:60000});
  } else {
    await expect(page.locator('.part.editor')).toBeVisible({timeout:60000});
  }
  return page;
}

async function select(page, section) {
  console.log('select',page.viewportSize().width,section);
  await page.locator(`.madlik-mobile-navigation [data-section="${section}"]`).click();
  await expect(page.locator(`[data-section="${section}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(`[id="${partId[section]}"]`)).toBeVisible({timeout:15000});
  const dimensions = await page.locator(`[id="${partId[section]}"]`).boundingBox();
  const nav = await page.locator('.madlik-mobile-navigation').boundingBox();
  expect(dimensions).not.toBeNull();
  expect(dimensions.width).toBeGreaterThan(page.viewportSize().width - 16);
  expect(dimensions.height).toBeGreaterThan(nav.y - 16);
  for (const id of ['workbench.parts.sidebar','workbench.parts.editor','workbench.parts.panel','workbench.parts.auxiliarybar']) {
    if (id !== partId[section]) await expect(page.locator(`[id="${id}"]`)).toBeHidden();
  }
}

async function command(page, title) {
  await page.keyboard.press('F1');
  const input = page.locator('.quick-input-widget input').first();
  await input.fill('>' + title);
  await page.locator('.quick-input-list .monaco-list-row').first().waitFor();
  await page.keyboard.press('Enter');
}

try {
  for (const viewport of [{width:390,height:844},{width:375,height:667}]) {
    const context = await browser.newContext({viewport});
    const page = await load(context,viewport);
    for (const section of ['files','git','editor','terminal','editor']) {
      await select(page,section);
      await page.screenshot({path:`.madlik/screenshots/${viewport.width}-${section}.png`});
    }
    await select(page,'files');
    console.log('open native file',viewport.width);
    await page.locator('.explorer-folders-view').getByText('hello.ts', {exact:true}).dblclick();
    await expect(page.locator('[data-section="editor"]')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.monaco-editor').first()).toBeVisible();
    await select(page,'git');
    console.log('open native diff',viewport.width);
    const changed = page.locator('.scm-view').getByText('hello.ts',{exact:true}).first();
    await expect(changed).toBeVisible({timeout:60000});
    await command(page, 'Git: Stage All Changes');
    await expect.poll(()=>execFileSync('git',['-C',workspace,'diff','--cached','--name-only'],{encoding:'utf8'})).toContain('hello.ts');
    await command(page, 'Git: Unstage All Changes');
    await expect.poll(()=>execFileSync('git',['-C',workspace,'diff','--cached','--name-only'],{encoding:'utf8'})).not.toContain('hello.ts');
    await changed.click();
    await expect(page.locator('[data-section="editor"]')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('.monaco-diff-editor').first()).toBeVisible();
    await select(page,'terminal');
    console.log('terminal persistence',viewport.width);
    const terminal = page.locator('.terminal-wrapper:visible .xterm-helper-textarea').first();
    await terminal.waitFor({state:'attached',timeout:15000});
    await terminal.focus();
    const marker = path.join(workspace, `terminal-${viewport.width}-${Date.now()}.pid`);
    await page.keyboard.type(`printf '%s' "$BASHPID" > '${marker}'; sleep 300`);
    await page.keyboard.press('Enter');
    await expect.poll(async()=>{try{return (await readFile(marker,'utf8')).trim()}catch{return ''}},{timeout:10000}).not.toBe('');
    const pid = Number(await readFile(marker,'utf8'));
    await select(page,'files');
    await select(page,'editor');
    await select(page,'terminal');
    process.kill(pid,0);
    await terminal.focus();
    await page.keyboard.press('Control+c');
    results.push(`${viewport.width}x${viewport.height}: modes, native Explorer/file, Git stage/unstage/diff, terminal process persistence OK`);
    console.log('mode toggle and rotation',viewport.width);
    await command(page, 'Madlik Mobile: Vypnout');
    await expect(page.locator('.madlik-mobile-navigation')).toBeHidden();
    await command(page, 'Madlik Mobile: Automaticky');
    await expect(page.locator('.madlik-mobile-navigation')).toBeVisible();
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('.madlik-mobile-navigation')).toBeHidden();
    await page.setViewportSize(viewport);
    await expect(page.locator('.madlik-mobile-navigation')).toBeVisible();
    await context.close();
  }
  const desktopContext = await browser.newContext({viewport:{width:1440,height:900}});
  const desktop = await load(desktopContext,{width:1440,height:900});
  await expect(desktop.locator('.madlik-mobile-navigation')).toBeHidden();
  const before = await desktop.locator('[id="workbench.parts.editor"]').boundingBox();
  const other = await browser.newContext({viewport:{width:390,height:844}});
  const mobile = await load(other,{width:390,height:844});
  for(const section of ['files','git','terminal','editor']) await select(mobile,section);
  expect(await desktop.locator('[id="workbench.parts.editor"]').boundingBox()).toEqual(before);
  await mobile.reload();
  await expect(mobile.locator('.madlik-mobile-navigation')).toBeVisible({timeout:60000});
  expect(await desktop.locator('[id="workbench.parts.editor"]').boundingBox()).toEqual(before);
  await desktop.setViewportSize({width:390,height:844});
  await expect(desktop.locator('.madlik-mobile-navigation')).toBeVisible();
  await select(desktop,'files');
  await desktop.setViewportSize({width:1440,height:900});
  await expect(desktop.locator('.madlik-mobile-navigation')).toBeHidden();
  await expect.poll(()=>desktop.locator('[id="workbench.parts.editor"]').boundingBox()).toEqual(before);
  await desktop.screenshot({path:'.madlik/screenshots/desktop-restored.png'});
  results.push('1440x900: desktop untouched during simultaneous mobile, reload and resize/restore OK');
  expect(errors).toEqual([]);
  console.log(results.join('\n'));
  await writeFile('.madlik/test-results.json',JSON.stringify({results,pageErrors:errors},null,2));
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({path:'.madlik/screenshots/failure.png'}).catch(()=>{});
  throw error;
} finally {
  await browser.close();
}
