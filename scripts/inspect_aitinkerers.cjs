const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('🔍 Launching browser to inspect AI Tinkerers hackathon page...');

  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined;

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  const targetUrl = 'https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc/entries';
  console.log(`Navigating to: ${targetUrl}`);

  try {
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`Response status: ${response ? response.status() : 'N/A'}`);
  } catch (e) {
    console.log(`Navigation note/error: ${e.message}`);
  }

  const title = await page.title();
  const currentUrl = page.url();
  console.log(`Page title: ${title}`);
  console.log(`Current URL: ${currentUrl}`);

  // Screenshot
  const screenshotPath = path.join(__dirname, '..', 'recordings', 'aitinkerers_entries_page.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  // Dump page content / form structure
  const pageDetails = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form')).map((f, i) => {
      const inputs = Array.from(f.querySelectorAll('input, textarea, select, button')).map(el => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        placeholder: el.placeholder || '',
        text: el.innerText || el.value || '',
      }));
      return { formIndex: i, action: f.action, method: f.method, inputs };
    });

    const buttons = Array.from(document.querySelectorAll('button, a')).map(el => ({
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || '').trim(),
      href: el.href || '',
      classes: el.className
    })).filter(b => b.text.length > 0 && (
      b.text.toLowerCase().includes('submit') ||
      b.text.toLowerCase().includes('entry') ||
      b.text.toLowerCase().includes('project') ||
      b.text.toLowerCase().includes('login') ||
      b.text.toLowerCase().includes('sign in') ||
      b.text.toLowerCase().includes('join')
    ));

    const bodySnippet = document.body.innerText.substring(0, 2000);

    return { forms, buttons, bodySnippet };
  });

  console.log('\n--- Page Details ---');
  console.log('Forms found:', JSON.stringify(pageDetails.forms, null, 2));
  console.log('Relevant buttons/links:', JSON.stringify(pageDetails.buttons, null, 2));
  console.log('Body snippet:\n', pageDetails.bodySnippet);

  // Check for hackathon base page as well
  console.log('\nChecking hackathon base URL...');
  try {
    await page.goto('https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc', { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`Base URL Title: ${await page.title()}`);
    const baseScreenshot = path.join(__dirname, '..', 'recordings', 'aitinkerers_base_page.png');
    await page.screenshot({ path: baseScreenshot, fullPage: false });
    console.log(`Base page screenshot saved to: ${baseScreenshot}`);
    
    const baseDetails = await page.evaluate(() => {
      return {
        textSnippet: document.body.innerText.substring(0, 1500),
        ctaButtons: Array.from(document.querySelectorAll('button, a'))
          .map(el => ({ text: el.innerText?.trim(), href: el.href }))
          .filter(x => x.text && x.text.length > 0)
      };
    });
    console.log('Base page text:\n', baseDetails.textSnippet);
    console.log('Base page buttons:\n', JSON.stringify(baseDetails.ctaButtons, null, 2));
  } catch (e) {
    console.log(`Error checking base URL: ${e.message}`);
  }

  await browser.close();
}

run().catch(console.error);
