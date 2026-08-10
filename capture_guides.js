const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 800 } 
  });
  const page = await browser.newPage();
  
  const publicDir = path.join(__dirname, 'public', 'guides');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    // 1. LOGIN DEMO
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
    
    // Screenshot: Form Login Kosong (login_demo.png)
    await delay(1000);
    await page.screenshot({ path: path.join(publicDir, 'login_demo.png') });
    console.log('Saved login_demo.png');

    // Perform Login
    await page.type('input[type="text"]', 'K268543');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for Dashboard (Client side routing)
    console.log('Waiting for login to complete...');
    await delay(3000); // Wait 3 seconds for toast and redirect
    console.log('Logged in successfully!');

    // 2. DASHBOARD DEMO
    await delay(2000);
    await page.screenshot({ path: path.join(publicDir, 'dashboard_demo.png') });
    console.log('Saved dashboard_demo.png');

    // 3. KANBAN DEMO
    console.log('Navigating to Kanban Board...');
    await page.goto('http://localhost:3000/tasks/board', { waitUntil: 'domcontentloaded' });
    await delay(2000);
    await page.screenshot({ path: path.join(publicDir, 'kanban_demo.png') });
    console.log('Saved kanban_demo.png');

    // 4. TASK LIST DEMO
    console.log('Navigating to Task List...');
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'domcontentloaded' });
    await delay(2000);
    await page.screenshot({ path: path.join(publicDir, 'task_list_demo.png') });
    console.log('Saved task_list_demo.png');

    // 5. SETTINGS DEMO
    console.log('Navigating to Settings...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'domcontentloaded' });
    await delay(2000);
    await page.screenshot({ path: path.join(publicDir, 'settings_demo.png') });
    console.log('Saved settings_demo.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    console.log('Done.');
  }
}

run();
