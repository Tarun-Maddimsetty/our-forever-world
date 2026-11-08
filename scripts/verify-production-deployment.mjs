import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log('====================================================');
console.log('   PRODUCTION BACKEND & ENDPOINT VERIFICATION SUITE  ');
console.log('====================================================');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`[Test] 1. Launching Production Server on port ${PORT}...`);
  const server = spawn('node', ['server/server.js'], {
    cwd: rootDir,
    env: { ...process.env, PORT: PORT.toString(), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (d) => console.log(`[Server Out] ${d.toString().trim()}`));
  server.stderr.on('data', (d) => console.error(`[Server Err] ${d.toString().trim()}`));

  // Wait for server ready
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (e) {
      if (i % 5 === 0) console.log(`[Wait probe ${i}] Fetch error:`, e.message, 'cause:', e.cause);
      await wait(300);
    }
  }

  if (!ready) {
    server.kill();
    throw new Error('Server failed to start within timeout.');
  }

  console.log('[Test] Server is healthy and reachable!\n');

  try {
    // TEST 1: Health Check
    console.log('[Test 1] Testing /api/health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('Health Response:', healthData);
    if (healthData.status !== 'ok' || !healthData.database || !healthData.storage) {
      throw new Error('Health check returned incomplete diagnostic data');
    }
    console.log('✓ PASS: Health check endpoint active with DB and Storage diagnostics\n');

    // TEST 2: Creator Creates Room
    console.log('[Test 2] Testing Creator room creation (POST /api/rooms)...');
    const createRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const createData = await createRes.json();
    if (!createData.success || !createData.roomCode || !createData.creatorToken) {
      throw new Error(`Failed to create room: ${JSON.stringify(createData)}`);
    }
    console.log(`Created Room ID: ${createData.roomId}, Code: ${createData.roomCode}`);
    console.log('✓ PASS: Room created with unique room code and secure creator token\n');

    const { roomId, roomCode, creatorToken } = createData;

    // TEST 3: Visitor Cannot Access Unpublished Draft Room
    console.log('[Test 3] Testing visitor access to UNPUBLISHED draft room...');
    const draftRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`);
    if (draftRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unpublished room, got ${draftRes.status}`);
    }
    const draftErr = await draftRes.json();
    console.log('Unpublished room protection message:', draftErr.error);
    console.log('✓ PASS: Visitor is strictly prevented from accessing unpublished room\n');

    // TEST 4: Creator Preview with Token Works on Draft
    console.log('[Test 4] Testing Creator Preview on unpublished room...');
    const previewRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    const previewData = await previewRes.json();
    if (!previewData.success || !previewData.isCreator) {
      throw new Error('Creator preview failed');
    }
    console.log('✓ PASS: Creator preview mode works with Bearer authentication\n');

    // TEST 5: Creator Updates Room Configuration
    console.log('[Test 5] Testing Creator Room Update (PUT /api/rooms/:roomId)...');
    const updateRes = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        title: 'Tarun & My Soulmate Forever ❤️',
        husbandName: 'Tarun',
        wifeName: 'My Beloved Wife',
      }),
    });
    const updateData = await updateRes.json();
    if (!updateData.success || updateData.room.husbandName !== 'Tarun') {
      throw new Error('Failed to update room configuration');
    }
    console.log('✓ PASS: Room updated and persisted successfully\n');

    // TEST 6: Unauthorized Modification Blocked (Security Check)
    console.log('[Test 6] Testing unauthorized modification without creator token...');
    const fakeRes = await fetch(`${BASE_URL}/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake_invalid_token_123',
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    if (fakeRes.status !== 403) {
      throw new Error(`Expected 403 for unauthorized edit, got ${fakeRes.status}`);
    }
    console.log('✓ PASS: Unauthorized room edits strictly rejected with 403 Forbidden\n');

    // TEST 7: Creator Publishes Room
    console.log('[Test 7] Testing Creator Publish (POST /api/rooms/:roomId/publish)...');
    const pubRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    const pubData = await pubRes.json();
    if (!pubData.success || !pubData.published) {
      throw new Error('Failed to publish room');
    }
    console.log(`✓ PASS: Room published successfully! RoomCode: ${pubData.roomCode}\n`);

    // TEST 8: Visitor Joins Published Room & Sanitization
    console.log('[Test 8] Testing Visitor Join of Published Room (GET /api/rooms/:roomCode)...');
    const visitorRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`);
    const visitorData = await visitorRes.json();
    if (!visitorData.success || !visitorData.room) {
      throw new Error('Visitor failed to fetch published room');
    }
    if (visitorData.isCreator) {
      throw new Error('Visitor should not be flagged as creator');
    }
    if (visitorData.room.creatorToken) {
      throw new Error('SECURITY VIOLATION: creatorToken leaked to visitor!');
    }
    if (visitorData.room.husbandName !== 'Tarun') {
      throw new Error('Visitor received outdated room data');
    }
    console.log('✓ PASS: Visitor successfully loaded room! creatorToken securely stripped.\n');

    // TEST 9: Invalid Room Code Handling
    console.log('[Test 9] Testing non-existent room code (404)...');
    const notFoundRes = await fetch(`${BASE_URL}/api/rooms/NON_EXISTENT_CODE_9999`);
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for missing code, got ${notFoundRes.status}`);
    }
    const notFoundData = await notFoundRes.json();
    console.log('404 Error response:', notFoundData.error);
    console.log('✓ PASS: Non-existent room codes properly return 404 with helpful error\n');

    console.log('====================================================');
    console.log('  ALL PRODUCTION BACKEND ENDPOINTS PASSED 100%! 🎉  ');
    console.log('====================================================');
  } finally {
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
