import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runVisitorSuite() {
  console.log('[Visitor Test] 1. Starting Backend Server...');
  const serverProc = spawn('node', ['server/server.js'], {
    env: { ...process.env, PORT: '3001' },
    stdio: 'pipe',
  });

  await sleep(1500);

  console.log('[Visitor Test] 2. Launching Headless Chrome...');
  const cdpPort = 9222;
  const browserProc = spawn(browserExe, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--window-size=1280,800',
    'about:blank',
  ]);

  await sleep(2000);

  const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const callbacks = new Map();
  let pageLoadedResolve = null;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
    if (data.method === 'Page.loadEventFired' && pageLoadedResolve) {
      pageLoadedResolve();
      pageLoadedResolve = null;
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  const navigateTo = async (url) => {
    const p = new Promise((r) => (pageLoadedResolve = r));
    await send('Page.navigate', { url });
    await Promise.race([p, sleep(3000)]);
    await sleep(2500);
  };

  const evalJS = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.result?.value;
  };

  console.log('[Visitor Test] Navigating to landing page...');
  await navigateTo('http://127.0.0.1:3001');

  // Clear session to ensure we are on Landing Page
  await evalJS('localStorage.clear()');
  await navigateTo('http://127.0.0.1:3001');

  // Input Room Code "HEART-3503"
  console.log('[Visitor Test] Entering room code HEART-3503 and clicking Join Room...');
  await evalJS(`(() => {
    const input = document.querySelector('input[placeholder*="LOVE"]') || document.querySelector('input[type="text"]');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'HEART-3503');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const joinBtn = document.getElementById('btn-join-room');
    if (joinBtn) {
      joinBtn.click();
    }
  })()`);

  // Wait for visitor mode transition
  let visitorReady = false;
  for (let i = 0; i < 25; i++) {
    const mode = await evalJS('window.__gameStore ? window.__gameStore.get().mode : null');
    if (mode === 'visitor') {
      visitorReady = true;
      break;
    }
    await sleep(250);
  }

  const visitorState = await evalJS(`(() => {
    const s = window.__gameStore ? window.__gameStore.get() : null;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    return {
      mode: s?.mode,
      currentRoom: s?.currentRoom,
      roomCode: s?.roomCode,
      hasEditStudio: buttons.some(t => t.includes('Edit Room Studio')),
      hasJoystick: !!document.querySelector('.touch-control-zone'),
    };
  })()`);

  console.log('\n========================================');
  console.log('       VISITOR WORKFLOW VERIFICATION    ');
  console.log('========================================');
  console.log(`✅ VISITOR MODE ACTIVE: ${visitorState.mode === 'visitor'}`);
  console.log(`✅ ROOM CODE MATCHED: ${visitorState.roomCode === 'HEART-3503'}`);
  console.log(`✅ READ-ONLY PROTECTION (NO STUDIO BUTTON): ${!visitorState.hasEditStudio}`);
  console.log(`✅ SANCTUARY INITIALIZED: ${visitorState.currentRoom === 'museum'}`);
  console.log('========================================\n');

  ws.close();
  browserProc.kill();
  serverProc.kill();

  if (visitorState.mode === 'visitor' && !visitorState.hasEditStudio) {
    console.log('VISITOR JOIN TEST PASSED COMPLETELY! 🎉');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVisitorSuite().catch((err) => {
  console.error('[Visitor Test Error]', err);
  process.exit(1);
});
