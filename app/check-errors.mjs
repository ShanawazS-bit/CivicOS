import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => {
    console.log('BROWSER ERROR:', error.message);
  });
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  } catch (e) {
    console.error('Failed to load page:', e);
  }
  await browser.close();
})();
