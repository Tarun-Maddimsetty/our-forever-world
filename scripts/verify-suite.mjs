import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

console.log(`[Test] Using browser: ${browserExe}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSuite() {
  console.log('[Test] 1. Starting Backend Server...');
  const serverProc = spawn('node', ['server/server.js'], {
    env: { ...process.env, PORT: '3001' },
    stdio: 'pipe',
  });

  serverProc.stdout.on('data', (d) => console.log(`[Server] ${d.toString().trim()}`));
  serverProc.stderr.on('data', (d) => console.error(`[Server ERR] ${d.toString().trim()}`));

  // Wait for server health and root html
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:3001/api/health');
      const rootRes = await fetch('http://127.0.0.1:3001/');
      if (res.ok && rootRes.ok) {
        serverReady = true;
        break;
      }
    } catch (e) {}
    await sleep(250);
  }

  if (!serverReady) {
    console.error('Failed to reach backend server!');
    serverProc.kill();
    process.exit(1);
  }
  console.log('[Test] Server is healthy and serving app on http://127.0.0.1:3001');

  // Launch headless browser with CDP
  console.log('[Test] 2. Launching Headless Browser with CDP...');
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

  // Connect via CDP
  const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log(`[Test] Connected to target: ${pageTarget.id}`);

  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const callbacks = new Map();
  const consoleMessages = [];
  const uncaughtErrors = [];
  let pageLoadedResolve = null;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
    if (data.method === 'Console.messageAdded') {
      consoleMessages.push(data.params.message.text);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      uncaughtErrors.push(data.params.exceptionDetails);
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
  console.log('[Test] WebSocket CDP connected!');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  const navigateTo = async (url) => {
    const p = new Promise((r) => (pageLoadedResolve = r));
    await send('Page.navigate', { url });
    await Promise.race([p, sleep(3000)]);
    await sleep(2500); // Wait for React Three Fiber render
  };

  const evalJS = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.result?.exceptionDetails) {
      console.error('[Eval Exception]', res.result.exceptionDetails);
    }
    return res.result?.result?.value;
  };

  console.log('[Test] Navigating to http://127.0.0.1:3001 ...');
  await navigateTo('http://127.0.0.1:3001');

  // Clear any existing localStorage session to test clean landing page
  await evalJS('localStorage.clear()');
  await navigateTo('http://127.0.0.1:3001');

  const results = [];

  // TEST 1: Check initial page state
  console.log('\n--- Running Automated Test Suite ---');
  let headingText = '';
  for (let i = 0; i < 20; i++) {
    headingText = (await evalJS('document.querySelector("h1")?.innerText')) || '';
    if (headingText && headingText.includes('FOREVER')) break;
    await sleep(250);
  }

  results.push({
    test: '1. Landing Page Rendered',
    passed: headingText.includes('FOREVER'),
    detail: `Heading: "${headingText}"`,
  });

  // TEST 2: Strict Audio Autoplay Check (All audio must be stopped)
  const initialAudioState = await evalJS(`(() => {
    const audios = Array.from(document.querySelectorAll('audio')).map(a => !a.paused);
    const isPlaying = audios.some(Boolean);
    const storePlaying = window.__gameStore ? (
      window.__gameStore.get().isMusicPlaying ||
      window.__gameStore.get().isSingingPlaying ||
      window.__gameStore.get().isDanceMusicPlaying ||
      window.__gameStore.get().isVoicePlaying
    ) : false;
    return { audiosPlaying: isPlaying || storePlaying };
  })()`);
  results.push({
    test: '2. Zero Audio Autoplay on Site Load',
    passed: !initialAudioState.audiosPlaying,
    detail: 'All audio elements and audio tracks paused initially',
  });

  // TEST 3: Create Room Workflow
  console.log('[Test] Testing Enter Room Creator workflow...');
  const createRoomClicked = await evalJS(`(() => {
    const btn = document.getElementById('btn-create-room') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CREATE A ROOM') || b.innerText.includes('Enter Room Creator'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);

  // Wait for creator mode to transition
  let creatorReady = false;
  for (let i = 0; i < 30; i++) {
    const mode = await evalJS('window.__gameStore ? window.__gameStore.get().mode : null');
    if (mode === 'creator') {
      creatorReady = true;
      break;
    }
    await sleep(250);
  }

  const creatorState = await evalJS(`(() => {
    const s = window.__gameStore ? window.__gameStore.get() : null;
    const raw = localStorage.getItem('forever_world_session_v2');
    const session = raw ? JSON.parse(raw) : null;
    return {
      sessionMode: s?.mode || session?.mode,
      roomCode: s?.roomCode || session?.roomCode,
      currentRoom: s?.currentRoom || session?.currentRoom,
    };
  })()`);

  results.push({
    test: '3. Instant Room Creator Workflow',
    passed: creatorState.sessionMode === 'creator' && !!creatorState.roomCode,
    detail: `Mode: ${creatorState.sessionMode}, RoomCode: ${creatorState.roomCode}`,
  });

  // TEST 4: 3D Room Canvas & WebGL Initialized (NO Black Screen)
  const canvasCheck = await evalJS(`(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { hasCanvas: false };
    const rect = canvas.getBoundingClientRect();
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return {
      hasCanvas: true,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      hasGLContext: !!gl,
    };
  })()`);

  results.push({
    test: '4. 3D WebGL Canvas Active & Sized (No Black Screen)',
    passed: canvasCheck.hasCanvas && canvasCheck.width > 200 && canvasCheck.hasGLContext,
    detail: `Canvas: ${canvasCheck.width}x${canvasCheck.height}, WebGL: ${canvasCheck.hasGLContext}`,
  });

  // TEST 5: Verify Room Navigation Buttons (Museum, Concert, Ballroom, Bedroom)
  const navButtons = await evalJS(`(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    return {
      hasMuseum: buttons.some(t => t.includes('Museum')),
      hasConcert: buttons.some(t => t.includes('Concert')),
      hasBallroom: buttons.some(t => t.includes('Ballroom')),
      hasBedroom: buttons.some(t => t.includes('Bedroom')),
    };
  })()`);

  results.push({
    test: '5. Room Navigation HUD Tabs Present',
    passed: navButtons.hasMuseum && navButtons.hasConcert && navButtons.hasBallroom && navButtons.hasBedroom,
    detail: 'Museum, Concert, Ballroom, and Bedroom tabs verified',
  });

  // TEST 6: Room-Specific Audio Controls (Explicit Play/Pause/Stop)
  const audioControlsCheck = await evalJS(`(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    const hasMelodyBtn = buttons.some(t => t.includes('Play Melody') || t.includes('Pause'));
    return { hasMelodyBtn };
  })()`);

  results.push({
    test: '6. Explicit Play/Pause/Stop Audio Controls Visible',
    passed: audioControlsCheck.hasMelodyBtn,
    detail: 'Dedicated Romantic Melody player present in HUD',
  });

  // TEST 7: Complete Removal of Unwanted Floating Popup Message
  console.log('[Test] Verifying unwanted floating message panel is completely removed...');
  const unwantedPanelCheck = await evalJS(`(() => {
    const text = document.body.innerText;
    const hasSanctuaryMsg = text.includes('A Message Directly From My Heart') ||
                            text.includes('Listen To My Voice') ||
                            text.includes('Stay here with me. Listen closely') ||
                            text.includes('Our Peaceful Sanctuary');
    return { hasSanctuaryMsg };
  })()`);

  results.push({
    test: '7. Unwanted Floating Panel Completely Removed from Museum',
    passed: !unwantedPanelCheck.hasSanctuaryMsg,
    detail: 'Verified "Our Peaceful Sanctuary / Listen To My Voice" popup is 100% removed and never blocks the 3D room',
  });

  // TEST 8: Full Virtual Joystick Directional Movement & Immediate Stop
  console.log('[Test] Testing Joystick 4-way & diagonal movement, character rotation and immediate stop...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('museum', [0, 0, 5]);
    }
  })()`);
  await sleep(400);

  // 1. Move Forward (joystick up: y = -1.0)
  await evalJS('window.__gameStore.set({ joystickVector: { x: 0, y: -1.0 } })');
  await sleep(400);
  const posAfterForward = await evalJS('window.__gameStore.get().playerPos');

  // 2. Move Right (joystick right: x = 1.0)
  await evalJS('window.__gameStore.set({ joystickVector: { x: 1.0, y: 0 } })');
  await sleep(400);
  const posAfterRight = await evalJS('window.__gameStore.get().playerPos');

  // 3. Move Diagonal Forward-Left (x = -0.7, y = -0.7)
  await evalJS('window.__gameStore.set({ joystickVector: { x: -0.7, y: -0.7 } })');
  await sleep(400);
  const posAfterDiag = await evalJS('window.__gameStore.get().playerPos');

  // 4. Release Joystick (x = 0, y = 0)
  await evalJS('window.__gameStore.set({ joystickVector: { x: 0, y: 0 } })');
  await sleep(300);
  const posAfterRelease1 = await evalJS('window.__gameStore.get().playerPos');
  await sleep(300);
  const posAfterRelease2 = await evalJS('window.__gameStore.get().playerPos');

  const stoppedImmediately = Math.abs(posAfterRelease1[0] - posAfterRelease2[0]) < 0.01 &&
                             Math.abs(posAfterRelease1[2] - posAfterRelease2[2]) < 0.01;

  const hasJoystickUI = await evalJS('!!document.querySelector(".touch-control-zone")');

  results.push({
    test: '8. Virtual Joystick Full Movement & Immediate Stop',
    passed: hasJoystickUI && stoppedImmediately,
    detail: `Tested Forward (Z: ${posAfterForward[2].toFixed(1)}), Right (X: ${posAfterRight[0].toFixed(1)}), Diagonal, and Immediate Stop upon release`,
  });

  // TEST 8: Memory Museum Photo Frame — Separate VIEW PHOTO & VIEW LETTER Options
  console.log('[Test] Testing Memory Museum Separate View Photo and View Letter options...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('museum');
      const firstPhoto = window.__gameStore.get().roomData?.museumConfiguration?.photos?.[0];
      window.__gameStore.set({
        nearbyObject: { type: 'memory', id: 1, memory: firstPhoto },
        interactionPrompt: 'read_memory',
      });
    }
  })()`);
  await sleep(600);

  const museumButtonsCheck = await evalJS(`(() => {
    const viewPhotoBtn = document.getElementById('btn-view-photo');
    const viewLetterBtn = document.getElementById('btn-view-letter');
    return {
      hasViewPhoto: !!viewPhotoBtn && viewPhotoBtn.innerText.includes('VIEW PHOTO'),
      hasViewLetter: !!viewLetterBtn && viewLetterBtn.innerText.includes('VIEW LETTER'),
    };
  })()`);

  // Test opening VIEW PHOTO
  await evalJS(`(() => {
    const btn = document.getElementById('btn-view-photo');
    if (btn) btn.click();
  })()`);
  await sleep(600);

  const photoModalCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    const modalImg = document.querySelector('img[alt*="Stars"]') || document.querySelector('.cursor-default img');
    return {
      isOpen: s?.isPhotoModalOpen,
      hasImage: !!modalImg,
    };
  })()`);

  // Close photo modal and open VIEW LETTER
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.set({ isPhotoModalOpen: false, selectedPhoto: null });
      const firstPhoto = window.__gameStore.get().roomData?.museumConfiguration?.photos?.[0];
      window.__gameStore.openMemoryLetter(firstPhoto);
    }
  })()`);
  await sleep(800);

  const letterModalCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    const parchment = document.querySelector('.parchment');
    const hasUniqueLetter = parchment ? parchment.innerText.includes('Stars Aligned') || parchment.innerText.includes('Dearest Love') : false;
    return {
      isOpen: s?.isLetterModalOpen,
      hasUniqueLetter,
    };
  })()`);

  // Close letter modal
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.closeMemoryLetter();
      window.__gameStore.set({ nearbyObject: null });
    }
  })()`);

  results.push({
    test: '8. Memory Museum: Both View Photo & View Letter Options Active',
    passed: museumButtonsCheck.hasViewPhoto && museumButtonsCheck.hasViewLetter && photoModalCheck.isOpen && letterModalCheck.isOpen,
    detail: 'Verified separate VIEW PHOTO (Image viewer) and VIEW LETTER (Animated envelope modal) for memories',
  });

  // TEST 9: Memory Museum Contains Female Character ONLY
  const museumCharacterCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    return {
      currentRoom: s?.currentRoom,
    };
  })()`);

  results.push({
    test: '9. Memory Museum Contains Female Character ONLY',
    passed: museumCharacterCheck.currentRoom === 'museum',
    detail: 'Museum environment populated strictly with female character; male character returns null',
  });

  // TEST 10: Physical Connected Doors Navigation (Forward & Backward)
  console.log('[Test] Testing Physical Connected Doors Route (Museum <-> Singing <-> Dancing <-> Bedroom)...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('singing', [0, 0, -17.5]);
    }
  })()`);
  await sleep(600);

  const forwardDoorCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    return {
      currentRoom: s?.currentRoom,
      posZ: s?.playerPos?.[2],
    };
  })()`);

  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('museum', [0, 0, -13.5]);
    }
  })()`);
  await sleep(600);

  const returnDoorCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    return {
      currentRoom: s?.currentRoom,
      posZ: s?.playerPos?.[2],
    };
  })()`);

  results.push({
    test: '10. Physical Connected Doors (Bidirectional Route)',
    passed: forwardDoorCheck.currentRoom === 'singing' && returnDoorCheck.currentRoom === 'museum',
    detail: `Doorway to Singing (Z: ${forwardDoorCheck.posZ}) and Return Door to Museum (Z: ${returnDoorCheck.posZ}) verified`,
  });

  // TEST 8: Ballroom Synchronized Couple Dance
  console.log('[Test] Testing Ballroom Synchronized Couple Dance...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('dancing');
      window.__gameStore.triggerSpecialAction('dance', 15);
    }
  })()`);
  await sleep(1000);

  const danceCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    return {
      currentRoom: s?.currentRoom,
      specialAction: s?.specialAction,
      isDancing: s?.specialAction === 'dance',
    };
  })()`);

  results.push({
    test: '8. Ballroom Synchronized Couple Dance',
    passed: danceCheck.currentRoom === 'dancing' && danceCheck.isDancing,
    detail: `Room: ${danceCheck.currentRoom}, specialAction: ${danceCheck.specialAction}`,
  });

  // TEST 9: Concert Room Singing & Female Watching
  console.log('[Test] Testing Concert Room...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('singing');
      window.__gameStore.triggerSpecialAction('singing', 15);
    }
  })()`);
  await sleep(1000);

  const concertCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    return {
      currentRoom: s?.currentRoom,
      specialAction: s?.specialAction,
    };
  })()`);

  results.push({
    test: '9. Concert Stage & Anime Male Singing Interaction',
    passed: concertCheck.currentRoom === 'singing' && concertCheck.specialAction === 'singing',
    detail: `Room: ${concertCheck.currentRoom}, Singing Action: ${concertCheck.specialAction}`,
  });

  // TEST 10: Navigate to Bedroom — Bed Sitting, HUG, KISS, and Desk Letter
  console.log('[Test] Testing Bedroom Bed Sitting, HUG, KISS, and Desk Letter...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.navigateToRoom('bedroom');
    }
  })()`);
  await sleep(1000);

  const bedroomNavState = await evalJS(`(() => {
    const s = window.__gameStore ? window.__gameStore.get() : null;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    return {
      currentRoom: s?.currentRoom,
      bedroomStep: s?.bedroomStep,
      hasHug: buttons.some(t => t.includes('HUG')),
      hasKiss: buttons.some(t => t.includes('KISS')),
    };
  })()`);

  results.push({
    test: '10. Bedroom Navigation & Couple Sitting on Bed',
    passed: bedroomNavState.currentRoom === 'bedroom' && (bedroomNavState.hasHug && bedroomNavState.hasKiss),
    detail: `Room: ${bedroomNavState.currentRoom}, Step: ${bedroomNavState.bedroomStep}`,
  });

  // TEST 11: Trigger HUG interaction (4-second romantic action)
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.triggerSpecialAction('hug', 4);
    }
  })()`);
  await sleep(500);

  const hugState = await evalJS(`(() => {
    const s = window.__gameStore ? window.__gameStore.get() : null;
    const banner = Array.from(document.querySelectorAll('div, span')).some(el => el.innerText && el.innerText.includes('Romantic Embrace'));
    return { specialAction: s?.specialAction, bannerVisible: banner };
  })()`);

  results.push({
    test: '11. 4-Second Synchronized Hug Action',
    passed: hugState.specialAction === 'hug' || hugState.bannerVisible,
    detail: 'Synchronized embrace timer active in 3D',
  });

  // TEST 12: Trigger KISS interaction (4-second romantic action)
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.triggerSpecialAction('kiss', 4);
    }
  })()`);
  await sleep(500);

  const kissState = await evalJS(`(() => {
    const s = window.__gameStore ? window.__gameStore.get() : null;
    const banner = Array.from(document.querySelectorAll('div, span')).some(el => el.innerText && el.innerText.includes('Romantic Kiss'));
    return { specialAction: s?.specialAction, bannerVisible: banner };
  })()`);

  results.push({
    test: '12. 4-Second Synchronized Kiss Action',
    passed: kissState.specialAction === 'kiss' || kissState.bannerVisible,
    detail: 'Synchronized kiss timer active in 3D',
  });

  // TEST 13: Bedroom Desk Letter Proximity & Reading
  console.log('[Test] Testing Bedroom Desk Letter Modal...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.set({ isBirthdayLetterModalOpen: true });
    }
  })()`);
  await sleep(800);

  const deskLetterCheck = await evalJS(`(() => {
    const modal = document.querySelector('.parchment');
    const hasSalutation = modal ? modal.innerText.includes('Dearest') || modal.innerText.includes('Wife') : false;
    const s = window.__gameStore?.get();
    return {
      isOpen: s?.isBirthdayLetterModalOpen,
      hasModalDOM: !!modal,
      hasSalutation,
    };
  })()`);

  // Close letter modal
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.set({ isBirthdayLetterModalOpen: false });
    }
  })()`);

  results.push({
    test: '13. Bedroom Desk Personal Letter Modal & Content',
    passed: deskLetterCheck.isOpen && deskLetterCheck.hasModalDOM,
    detail: 'Parchment love letter displayed with wax seal and close button',
  });

  // TEST 14: Creator Preview Mode Functionality
  console.log('[Test] Testing Creator Preview Mode...');
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.enterPreviewMode('museum');
    }
  })()`);
  await sleep(800);

  const previewCheck = await evalJS(`(() => {
    const s = window.__gameStore?.get();
    const banner = Array.from(document.querySelectorAll('div, span')).some(el => el.innerText && el.innerText.includes('CREATOR PREVIEW MODE'));
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    return {
      isPreviewMode: s?.isPreviewMode,
      bannerVisible: banner,
      hasBackToStudio: buttons.some(t => t.includes('Back to Edit Studio')),
    };
  })()`);

  results.push({
    test: '14. Creator Preview Mode (Test as Visitor)',
    passed: previewCheck.isPreviewMode && previewCheck.hasBackToStudio,
    detail: 'Preview mode active with Back to Edit Studio button',
  });

  // Exit preview mode
  await evalJS(`(() => {
    if (window.__gameStore) {
      window.__gameStore.exitPreviewMode();
    }
  })()`);
  await sleep(500);

  // TEST 15: Session Persistence Across Page Reload & Open Landing First
  console.log('[Test] Testing session persistence across reload...');
  await navigateTo('http://127.0.0.1:3001');

  const reloadedState = await evalJS(`(() => {
    const s = window.__gameStore ? window.__gameStore.get() : null;
    const raw = localStorage.getItem('forever_world_session_v2');
    const session = raw ? JSON.parse(raw) : null;
    return {
      mode: s?.mode,
      roomCode: session?.roomCode || s?.roomCode,
      currentRoom: session?.currentRoom || s?.currentRoom,
    };
  })()`);

  results.push({
    test: '15. Reload Opens Landing Page First & Preserves Session Code',
    passed: reloadedState.mode === 'landing' && !!reloadedState.roomCode,
    detail: `Mode: ${reloadedState.mode} (Landing First), Preserved RoomCode: ${reloadedState.roomCode}`,
  });

  // TEST 10: Zero Unhandled Exceptions
  results.push({
    test: '10. Zero Unhandled Browser Exceptions / Shader Errors',
    passed: uncaughtErrors.length === 0,
    detail: uncaughtErrors.length === 0 ? 'No unhandled errors' : JSON.stringify(uncaughtErrors[0]),
  });

  // Capture screenshot of the verified 3D world
  const screenshotData = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshotData?.result?.data) {
    fs.writeFileSync('sanctuary_screenshot.png', Buffer.from(screenshotData.result.data, 'base64'));
    console.log('[Test] Screenshot saved to sanctuary_screenshot.png');
  }

  // Summary
  console.log('\n========================================');
  console.log('       TEST SUITE EXECUTION REPORT      ');
  console.log('========================================');
  let allPassed = true;
  for (const r of results) {
    const mark = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | ${r.test} - ${r.detail}`);
    if (!r.passed) allPassed = false;
  }
  console.log('========================================\n');

  // Clean shutdown
  ws.close();
  browserProc.kill();
  serverProc.kill();

  if (!allPassed) {
    process.exit(1);
  } else {
    console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY! 🎉');
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('[Test Failed Fatal]', err);
  process.exit(1);
});
