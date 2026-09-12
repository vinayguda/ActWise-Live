const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting signin inspection...');
  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined;

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to signin page...');
  await page.goto('https://atlanta.aitinkerers.org/signin?r=https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc/entries', { 
    waitUntil: 'domcontentloaded', 
    timeout: 15000 
  });
  await page.waitForTimeout(3000);

  console.log('Title:', await page.title());
  console.log('URL:', page.url());

  const screenshotPath = path.join(__dirname, '..', 'recordings', 'aitinkerers_signin.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot:', screenshotPath);

  const info = await page.evaluate(() => {
    return {
      buttons: Array.from(document.querySelectorAll('button, a')).map(el => ({
        text: el.innerText.trim(),
        href: el.href || null,
        tag: el.tagName
      })).filter(x => x.text),
      inputs: Array.from(document.querySelectorAll('input')).map(el => ({
        type: el.type,
        name: el.name,
        placeholder: el.placeholder
      }))
    };
  });

  console.log('Inputs:', JSON.stringify(info.inputs, null, 2));
  console.log('Buttons:', JSON.stringify(info.buttons, null, 2));

  await browser.close();
}

run().catch(console.error);
