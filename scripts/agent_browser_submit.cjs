const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SUBMISSION_DATA = {
  title: 'ActWise Live',
  tagline: 'Ambient Voice Intelligence & Grounding Layer for NICE Actimize Documentation',
  liveUrl: 'https://actwise-live-218423701961.us-central1.run.app',
  githubUrl: 'https://github.com/vinayguda/ActWise-Live',
  videoUrl: 'https://github.com/vinayguda/ActWise-Live/raw/main/recordings/ActWise_Live_Demo_Submission.webm',
  tracks: ['Google Cloud Run', 'CopilotKit'],
  description: `### Problem
Compliance teams, fincrime analysts, and developers lose hours navigating dense 500+ page NICE Actimize enterprise documentation (AML-SAM, CDD, ActOne 10.2, IFM, AIS, SURVEIL-X). A single misconfiguration in an installation parameter or database migration can break surveillance pipelines or trigger compliance audit failures. Standard LLMs hallucinate configuration parameters or force users into static chatboxes.

### Solution: ActWise Live
ActWise Live brings AI agents out of the chatbox and directly into the ambient workflow of compliance and platform engineering.

Key Capabilities:
1. Sub-Second Voice AI: Powered by Google Gemini 2.0 / 3.8 Flash with Aoede speech synthesis, real-time barge-in, and an executive voice persona that speaks 1-2 sentence summaries out loud while streaming technical procedures on screen.
2. Strict MCP Grounding: Direct integration with ActWise DOCenter Model Context Protocol (MCP) server. Strictly calls search_docs and get_page, never answers without citations, and renders official portal URLs for every claim.
3. Interactive Setup Checklists: Automatically converts complex procedural installation guides (like ActOne 10.2 Enterprise Installation) into reactive, clickable step checklists.
4. Side-by-Side Version Matrix: Renders version comparison matrices (ActOne 10.1 vs 10.2) detailing added features (Kafka native streaming), enhanced APIs, and deprecated SOAP endpoints.
5. Ambient Chrome Sidecar ("ActWise Anywhere"): Manifest V3 extension allows users to highlight any Actimize error code or config property on any internal page to trigger ambient voice intelligence.
6. Google Cloud Run Deployment: High-concurrency containerized microservice deployed live on Google Cloud Run with sub-second response times.

### Tech Stack
- Google Gemini 2.0 / 3.8 Flash (Multimodal Live & Speech)
- Model Context Protocol (MCP) Server for DOCenter
- Google Cloud Run (Production containerized deployment)
- React 19 & Tailwind CSS v4 UI with CopilotKit agentic components
- Node.js / Express streaming backend
- Manifest V3 Chrome Extension Sidecar`
};

async function run() {
  console.log('🤖 Agent Browser: Initializing automated form submission...');

  // We can also connect to an existing Chrome if debugging port is open, or launch fresh with user data dir
  // Let's check Chrome user default profile dir
  const appData = process.env.LOCALAPPDATA || 'C:\\Users\\vguda\\AppData\\Local';
  const chromeUserDir = path.join(appData, 'Google', 'Chrome', 'User Data');
  
  // To avoid profile in-use lock, create a cloned or dedicated profile or run fresh
  const profileDir = path.join(__dirname, '..', '.agent_browser_profile');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  console.log('Navigating to entries page...');
  const res = await page.goto('https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc/entries', {
    waitUntil: 'networkidle',
    timeout: 30000
  }).catch(e => console.log('Navigation warning:', e.message));

  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  const screenshotPath1 = path.join(__dirname, '..', 'recordings', 'agent_browser_page.png');
  await page.screenshot({ path: screenshotPath1, fullPage: true });
  console.log('Saved screenshot 1:', screenshotPath1);

  // Check page text
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body snippet (first 500 chars):\n', bodyText.slice(0, 500));

  // Check forms and inputs
  const elements = await page.evaluate(() => {
    return {
      forms: document.querySelectorAll('form').length,
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, id: i.id, placeholder: i.placeholder, type: i.type })),
      textareas: Array.from(document.querySelectorAll('textarea')).map(t => ({ name: t.name, id: t.id, placeholder: t.placeholder })),
      buttons: Array.from(document.querySelectorAll('button, a')).map(b => ({ text: b.innerText.trim(), href: b.href || null })).filter(b => b.text)
    };
  });

  console.log('Detected elements:', JSON.stringify(elements, null, 2));

  await browser.close();
}

run().catch(console.error);
