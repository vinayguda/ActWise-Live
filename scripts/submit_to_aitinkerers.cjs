/**
 * Playwright Automation Helper for AI Tinkerers Hackathon Submission
 * 
 * Hackathon: Agents, Everywhere Global Hackathon (Atlanta / Global)
 * Target URL: https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc/entries
 * Project: ActWise Live
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SUBMISSION_DATA = {
  title: 'ActWise Live',
  tagline: 'Ambient Voice Intelligence & Grounding Layer for NICE Actimize Documentation',
  liveUrl: 'https://actwise-live-218423701961.us-central1.run.app',
  githubUrl: 'https://github.com/vinayguda/ActWise-Live',
  videoUrl: '', // Can be filled if user has YouTube or Loom URL
  tracks: 'Google Cloud Run, CopilotKit, Voice AI, Enterprise Agents',
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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('====================================================');
  console.log('🚀 ActWise Live — AI Tinkerers Submission Helper');
  console.log('====================================================');

  const userDataDir = path.join(__dirname, '..', '.aitinkerers_profile');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : undefined;

  console.log('🌐 Launching Chrome in headed mode with persistent profile...');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: chromePath,
    viewport: { width: 1440, height: 920 },
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  const entriesUrl = 'https://atlanta.aitinkerers.org/hackathons/h_pS99rSfunCc/entries';
  console.log(`📌 Navigating to: ${entriesUrl}`);
  await page.goto(entriesUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});

  await sleep(2000);

  // Helper to inject banner on top
  async function showBanner(msg, isSuccess = false) {
    try {
      await page.evaluate(({ msg, isSuccess }) => {
        let b = document.getElementById('actwise-submission-helper-banner');
        if (!b) {
          b = document.createElement('div');
          b.id = 'actwise-submission-helper-banner';
          b.style.position = 'fixed';
          b.style.top = '0';
          b.style.left = '0';
          b.style.right = '0';
          b.style.zIndex = '99999999';
          b.style.padding = '12px 20px';
          b.style.fontSize = '14px';
          b.style.fontFamily = 'system-ui, sans-serif';
          b.style.fontWeight = '600';
          b.style.textAlign = 'center';
          b.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          b.style.transition = 'all 0.3s ease';
          document.body.prepend(b);
        }
        b.style.background = isSuccess 
          ? 'linear-gradient(90deg, #059669, #0d9488)' 
          : 'linear-gradient(90deg, #4f46e5, #06b6d4)';
        b.style.color = '#ffffff';
        b.innerHTML = msg;
      }, { msg, isSuccess });
    } catch (e) {}
  }

  // Check login state
  let isAuthenticated = false;
  while (!isAuthenticated) {
    const pageContent = await page.content();
    const needsLogin = pageContent.includes('You must be signed in to submit a project') ||
                         pageContent.includes('Sign in') && !pageContent.includes('Sign out') && !pageContent.includes('Profile');

    if (needsLogin) {
      console.log('⚠️ Authentication required: Please sign in with your Google or AI Tinkerers account in the Chrome window.');
      await showBanner('⚠️ <strong>Authentication Required:</strong> Please click <em>Sign In</em> and log into AI Tinkerers. This script will automatically detect your login and populate the submission fields.');
      await sleep(3000);
    } else {
      isAuthenticated = true;
      console.log('✅ Authenticated successfully!');
      await showBanner('✅ <strong>Logged in!</strong> Detecting submission form and populating ActWise Live project details...', true);
      break;
    }
  }

  // Look for Submit / New Entry button if form not immediately open
  try {
    const submitBtn = await page.$('button:has-text("Submit Entry"), a:has-text("Submit Entry"), button:has-text("Add Entry"), a:has-text("Submit a project"), button:has-text("Submit a project"), button:has-text("New Project")');
    if (submitBtn) {
      console.log('👉 Found submission button, clicking...');
      await submitBtn.click();
      await sleep(2000);
    }
  } catch (e) {
    console.log('Note looking for button:', e.message);
  }

  // Attempt to fill known form fields
  console.log('✍️ Populating form fields with ActWise Live information...');

  const fillField = async (selectors, value, fieldName) => {
    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) {
          console.log(`  ✓ Populating ${fieldName} using selector: ${sel}`);
          await el.scrollIntoViewIfNeeded();
          await el.fill('');
          await el.fill(value);
          // Highlight filled field
          await el.evaluate(e => {
            e.style.outline = '3px solid #10b981';
            e.style.background = '#f0fdf4';
          });
          return true;
        }
      } catch (e) {}
    }
    return false;
  };

  // Title / Name
  await fillField([
    'input[name*="title" i]',
    'input[name*="name" i]',
    'input[placeholder*="title" i]',
    'input[placeholder*="project name" i]',
    'input[id*="title" i]',
    'input[id*="name" i]'
  ], SUBMISSION_DATA.title, 'Project Title');

  // Tagline / Short Pitch
  await fillField([
    'input[name*="tagline" i]',
    'input[name*="short" i]',
    'input[name*="pitch" i]',
    'input[placeholder*="tagline" i]',
    'input[placeholder*="short description" i]',
    'input[placeholder*="one sentence" i]',
    'input[id*="tagline" i]'
  ], SUBMISSION_DATA.tagline, 'Tagline / Short Pitch');

  // Live / Demo URL
  await fillField([
    'input[name*="demo" i]',
    'input[name*="url" i]',
    'input[name*="live" i]',
    'input[name*="app" i]',
    'input[placeholder*="demo" i]',
    'input[placeholder*="live" i]',
    'input[placeholder*="url" i]',
    'input[id*="url" i]'
  ], SUBMISSION_DATA.liveUrl, 'Live App URL');

  // GitHub / Repo URL
  await fillField([
    'input[name*="github" i]',
    'input[name*="repo" i]',
    'input[name*="code" i]',
    'input[placeholder*="github" i]',
    'input[placeholder*="repository" i]',
    'input[id*="github" i]'
  ], SUBMISSION_DATA.githubUrl, 'GitHub URL');

  // Detailed Description
  await fillField([
    'textarea[name*="desc" i]',
    'textarea[name*="detail" i]',
    'textarea[name*="story" i]',
    'textarea[name*="body" i]',
    'textarea[placeholder*="description" i]',
    'textarea[placeholder*="about" i]',
    'textarea'
  ], SUBMISSION_DATA.description, 'Detailed Description');

  await showBanner('🎉 <strong>ActWise Live Details Populated!</strong> Please review all fields in the form and click Submit when ready.', true);

  console.log('\n====================================================');
  console.log('✨ Population complete! Browser window is kept OPEN for review.');
  console.log('📝 Please review all inputs in the browser, verify fields, and click Submit.');
  console.log('====================================================\n');

  // Keep process alive for user interaction
  console.log('Waiting for user review (Press Ctrl+C in terminal when done)...');
  await new Promise((resolve) => setTimeout(resolve, 600000)); // Keep open 10 mins
}

run().catch(console.error);
