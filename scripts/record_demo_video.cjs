const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothMove(page, fromX, fromY, toX, toY, steps = 22) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const curX = fromX + (toX - fromX) * ease;
    const curY = fromY + (toY - fromY) * ease;
    await page.mouse.move(curX, curY);
    await sleep(15);
  }
}

async function run() {
  console.log('🎬 Starting ActWise Live Master Demo Video Recorder (1080p)...');

  const recordingsDir = path.join(__dirname, '..', 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Users\\vguda\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Inject Custom Glowing Cursor and Click Animation
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.id = 'actwise-demo-cursor';
      cursor.style.position = 'fixed';
      cursor.style.width = '28px';
      cursor.style.height = '28px';
      cursor.style.borderRadius = '50%';
      cursor.style.background = 'radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(99,102,241,0.5) 100%)';
      cursor.style.border = '2px solid rgba(255,255,255,0.9)';
      cursor.style.boxShadow = '0 0 15px rgba(6,182,212,0.8), 0 0 30px rgba(99,102,241,0.5)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999999';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.transition = 'transform 0.12s ease-out, background 0.15s ease';
      document.body.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      });

      window.addEventListener('mousedown', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
        cursor.style.background = 'radial-gradient(circle, rgba(236,72,153,0.95) 0%, rgba(244,63,94,0.7) 100%)';
        cursor.style.boxShadow = '0 0 20px rgba(236,72,153,0.9)';
      });

      window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.background = 'radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(99,102,241,0.5) 100%)';
        cursor.style.boxShadow = '0 0 15px rgba(6,182,212,0.8), 0 0 30px rgba(99,102,241,0.5)';
      });
    });
  });

  // SCENE 0: Title Card Intro Slide
  console.log('📌 Scene 0: Title Card Intro Slide');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
          color: #fff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .container {
          text-align: center;
          max-width: 980px;
          animation: fadeIn 1.2s ease-out;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 9999px;
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid rgba(6, 182, 212, 0.4);
          color: #22d3ee;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 26px;
        }
        h1 {
          font-size: 72px;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin: 0 0 18px 0;
          background: linear-gradient(135deg, #ffffff 30%, #67e8f9 70%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.subtitle {
          font-size: 26px;
          color: #94a3b8;
          margin: 0 0 45px 0;
          line-height: 1.4;
          font-weight: 300;
        }
        .sponsors {
          display: flex;
          justify-content: center;
          gap: 20px;
          font-size: 16px;
          color: #cbd5e1;
        }
        .sponsor-tag {
          padding: 8px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">🎙️ Agents, Everywhere Global Hackathon 2026</div>
        <h1>ActWise Live</h1>
        <p class="subtitle">Ambient Voice Intelligence & Grounding Layer for NICE Actimize Enterprise Documentation</p>
        <div class="sponsors">
          <span class="sponsor-tag">⚡ Gemini 2.0 / 3.8 Flash</span>
          <span class="sponsor-tag">🔌 Model Context Protocol (MCP)</span>
          <span class="sponsor-tag">☁️ Google Cloud Run</span>
          <span class="sponsor-tag">🧩 Chrome Sidecar Extension</span>
        </div>
      </div>
    </body>
    </html>
  `);
  await sleep(7500);

  // SCENE 1: Navigate to Live Web Application
  console.log('📌 Scene 1: ActWise Live Web Application Overview');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(3500);

  let mouseX = 960;
  let mouseY = 540;
  await page.mouse.move(mouseX, mouseY);

  // Smooth hover over Header Title
  await smoothMove(page, mouseX, mouseY, 180, 24, 20);
  mouseX = 180;
  mouseY = 24;
  await sleep(1000);

  // Smooth hover over MCP Health Indicator
  await smoothMove(page, mouseX, mouseY, 640, 24, 20);
  mouseX = 640;
  mouseY = 24;
  await sleep(1200);

  // Smooth hover over Voice Orb
  await smoothMove(page, mouseX, mouseY, 960, 260, 25);
  mouseX = 960;
  mouseY = 260;
  await sleep(1500);

  // SCENE 2: Interactive Setup Checklist Demo
  console.log('📌 Scene 2: Interactive Setup Checklist (<InstallationChecklist />)');

  // Scroll down chat stream to focus checklist
  await page.evaluate(() => {
    const chat = document.querySelector('.overflow-y-auto');
    if (chat) chat.scrollTop = 220;
  });
  await sleep(1500);

  // Click Checklist Steps 1 through 4
  console.log('  -> Interacting with Checklist Step 1');
  const step1 = await page.waitForSelector('text=Step 1:');
  const s1Box = await step1.boundingBox();
  if (s1Box) {
    await smoothMove(page, mouseX, mouseY, s1Box.x + 120, s1Box.y + s1Box.height / 2, 18);
    mouseX = s1Box.x + 120;
    mouseY = s1Box.y + s1Box.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(1000);

  console.log('  -> Interacting with Checklist Step 2');
  const step2 = await page.waitForSelector('text=Step 2:');
  const s2Box = await step2.boundingBox();
  if (s2Box) {
    await smoothMove(page, mouseX, mouseY, s2Box.x + 120, s2Box.y + s2Box.height / 2, 18);
    mouseX = s2Box.x + 120;
    mouseY = s2Box.y + s2Box.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(1000);

  console.log('  -> Interacting with Checklist Step 3');
  const step3 = await page.waitForSelector('text=Step 3:');
  const s3Box = await step3.boundingBox();
  if (s3Box) {
    await smoothMove(page, mouseX, mouseY, s3Box.x + 120, s3Box.y + s3Box.height / 2, 18);
    mouseX = s3Box.x + 120;
    mouseY = s3Box.y + s3Box.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(1000);

  console.log('  -> Interacting with Checklist Step 4 (Complete 100%)');
  const step4 = await page.waitForSelector('text=Step 4:');
  const s4Box = await step4.boundingBox();
  if (s4Box) {
    await smoothMove(page, mouseX, mouseY, s4Box.x + 120, s4Box.y + s4Box.height / 2, 18);
    mouseX = s4Box.x + 120;
    mouseY = s4Box.y + s4Box.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(3500);

  // SCENE 3: Version Comparison Matrix Demo
  console.log('📌 Scene 3: Version Comparison Matrix (<VersionCompareMatrix />)');

  // Scroll down chat stream to focus matrix
  await page.evaluate(() => {
    const chat = document.querySelector('.overflow-y-auto');
    if (chat) chat.scrollTop = 580;
  });
  await sleep(1200);

  // Hover over the Matrix Table and Badges
  const matrixTable = await page.waitForSelector('table');
  const tableBox = await matrixTable.boundingBox();
  if (tableBox) {
    await smoothMove(page, mouseX, mouseY, tableBox.x + 200, tableBox.y + 40, 20);
    mouseX = tableBox.x + 200;
    mouseY = tableBox.y + 40;
    await sleep(1200);

    // Hover over "+ NEW" badge
    await smoothMove(page, mouseX, mouseY, tableBox.x + tableBox.width - 60, tableBox.y + 40, 20);
    mouseX = tableBox.x + tableBox.width - 60;
    mouseY = tableBox.y + 40;
    await sleep(1200);

    // Hover over "⚡ ENHANCED" badge
    await smoothMove(page, mouseX, mouseY, tableBox.x + tableBox.width - 60, tableBox.y + 80, 18);
    mouseX = tableBox.x + tableBox.width - 60;
    mouseY = tableBox.y + 80;
    await sleep(1200);

    // Hover over "⚠️ DEPRECATED" badge
    await smoothMove(page, mouseX, mouseY, tableBox.x + tableBox.width - 60, tableBox.y + tableBox.height - 30, 20);
    mouseX = tableBox.x + tableBox.width - 60;
    mouseY = tableBox.y + tableBox.height - 30;
    await sleep(1500);
  }

  // Hover over Verified DOCenter Citations
  const citationBadge = await page.waitForSelector('text=Verified NICE Actimize Documentation Sources');
  const citBox = await citationBadge.boundingBox();
  if (citBox) {
    await smoothMove(page, mouseX, mouseY, citBox.x + 140, citBox.y + citBox.height / 2, 18);
    mouseX = citBox.x + 140;
    mouseY = citBox.y + citBox.height / 2;
    await sleep(1500);
  }

  // SCENE 4: DOCenter MCP Inspector Modal
  console.log('📌 Scene 4: MCP Telemetry & Inspector Modal (<McpInspectorModal />)');
  const mcpHealthBtn = await page.waitForSelector('button[title*="MCP Inspector"]');
  const mcpBtnBox = await mcpHealthBtn.boundingBox();
  if (mcpBtnBox) {
    await smoothMove(page, mouseX, mouseY, mcpBtnBox.x + mcpBtnBox.width / 2, mcpBtnBox.y + mcpBtnBox.height / 2, 22);
    mouseX = mcpBtnBox.x + mcpBtnBox.width / 2;
    mouseY = mcpBtnBox.y + mcpBtnBox.height / 2;
    await sleep(500);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(2500);

  // Close MCP Inspector
  const closeMcpBtn = await page.waitForSelector('button:has(svg.lucide-x)');
  const closeBox = await closeMcpBtn.boundingBox();
  if (closeBox) {
    await smoothMove(page, mouseX, mouseY, closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2, 18);
    mouseX = closeBox.x + closeBox.width / 2;
    mouseY = closeBox.y + closeBox.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(1000);

  // SCENE 5: 1-Click Submission Package Modal
  console.log('📌 Scene 5: Hackathon Submission Package Modal (<SubmissionModal />)');
  const subBtn = await page.waitForSelector('button:has-text("Submission Package")');
  const subBox = await subBtn.boundingBox();
  if (subBox) {
    await smoothMove(page, mouseX, mouseY, subBox.x + subBox.width / 2, subBox.y + subBox.height / 2, 22);
    mouseX = subBox.x + subBox.width / 2;
    mouseY = subBox.y + subBox.height / 2;
    await sleep(500);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(2000);

  // Click Copy URL button in Modal
  const copyUrlBtn = await page.waitForSelector('button:has-text("Copy URL")');
  const copyBox = await copyUrlBtn.boundingBox();
  if (copyBox) {
    await smoothMove(page, mouseX, mouseY, copyBox.x + copyBox.width / 2, copyBox.y + copyBox.height / 2, 18);
    mouseX = copyBox.x + copyBox.width / 2;
    mouseY = copyBox.y + copyBox.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(1500);

  // Smooth scroll down the Submission Modal
  console.log('  -> Scrolling through 2-Minute Video Script & Storyboard');
  await page.evaluate(() => {
    const modalContent = document.querySelector('.max-w-3xl');
    if (modalContent) modalContent.scrollTop = 340;
  });
  await sleep(2500);

  // Close Submission Modal
  const closeSubBtn = await page.waitForSelector('button:has-text("Close Window")');
  const closeSubBox = await closeSubBtn.boundingBox();
  if (closeSubBox) {
    await smoothMove(page, mouseX, mouseY, closeSubBox.x + closeSubBox.width / 2, closeSubBox.y + closeSubBox.height / 2, 18);
    mouseX = closeSubBox.x + closeSubBox.width / 2;
    mouseY = closeSubBox.y + closeSubBox.height / 2;
    await sleep(400);
    await page.mouse.down();
    await sleep(120);
    await page.mouse.up();
  }
  await sleep(1200);

  // SCENE 6: Outro Slide
  console.log('📌 Scene 6: Outro Slide');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          background: radial-gradient(circle at center, #090d16 0%, #020617 100%);
          color: #fff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          max-width: 920px;
          animation: fadeIn 1s ease-out;
        }
        h2 {
          font-size: 56px;
          font-weight: 800;
          margin: 0 0 16px 0;
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          font-size: 24px;
          color: #94a3b8;
          margin: 0 0 34px 0;
        }
        .card {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(6, 182, 212, 0.4);
          border-radius: 16px;
          padding: 24px 36px;
          display: inline-block;
          font-family: monospace;
          font-size: 18px;
          color: #22d3ee;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          margin-bottom: 28px;
        }
        .links {
          display: flex;
          justify-content: center;
          gap: 24px;
          font-size: 16px;
          color: #64748b;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>ActWise Live</h2>
        <p>Ambient Voice AI for NICE Actimize Enterprise Documentation</p>
        <div class="card">
          🌐 https://actwise-live-218423701961.us-central1.run.app
        </div>
        <div class="links">
          <span>GitHub: github.com/vinayguda/ActWise-Live</span>
          <span>•</span>
          <span>Agents, Everywhere Global Hackathon 2026</span>
        </div>
      </div>
    </body>
    </html>
  `);
  await sleep(6000);

  console.log('💾 Saving recorded video...');
  await page.close();
  await context.close();
  await browser.close();

  // Find generated video in recordingsDir
  const files = fs.readdirSync(recordingsDir).filter((f) => f.endsWith('.webm') && f.startsWith('page@'));
  if (files.length > 0) {
    // Sort by modification time to get newest
    files.sort((a, b) => fs.statSync(path.join(recordingsDir, b)).mtimeMs - fs.statSync(path.join(recordingsDir, a)).mtimeMs);
    const latestVideo = path.join(recordingsDir, files[0]);
    const finalVideoPath = path.join(recordingsDir, 'ActWise_Live_Demo_Submission.webm');
    fs.copyFileSync(latestVideo, finalVideoPath);
    console.log(`\n🎉 Master Demo Video Recorded Successfully!`);
    console.log(`📁 File: ${finalVideoPath}`);
    console.log(`📊 Size: ${(fs.statSync(finalVideoPath).size / (1024 * 1024)).toFixed(2)} MB`);
  }
}

run().catch((err) => {
  console.error('Error during video recording:', err);
  process.exit(1);
});
