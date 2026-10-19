import { chromium } from '../lib/vscode/node_modules/playwright/index.mjs';
import { expect } from '../lib/vscode/node_modules/@playwright/test/index.mjs';

const [base, workspace] = process.argv.slice(2);
const browser = await chromium.launch({headless: true});
try {
  for (const mobile of [true, false]) {
    const context = await browser.newContext({
      viewport: mobile ? {width: 390, height: 844} : {width: 1280, height: 900},
      isMobile: mobile, hasTouch: mobile,
    });
    try {
      const page = await context.newPage();
      await page.goto(`${base}/?folder=${encodeURIComponent(workspace)}`);
      await expect(page.locator('.monaco-workbench')).toBeVisible({timeout: 60000});
      const navigation = page.locator('.madlik-mobile-navigation');
      if (mobile) {
        await expect(navigation).toBeVisible({timeout: 60000});
        await navigation.locator('[data-section="terminal"]').click();
        await expect(page.locator('[id="workbench.parts.panel"]')).toBeVisible();
        await expect(page.locator('.xterm-screen').first()).toBeVisible({timeout: 30000});
        await expect(page.locator('.madlik-mobile-terminal-keys')).toBeVisible();
      } else {
        await expect(navigation).toBeHidden();
        await expect(page.locator('[id="workbench.parts.editor"]')).toBeVisible();
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
