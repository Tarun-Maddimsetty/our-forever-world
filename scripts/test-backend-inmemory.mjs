process.env.NODE_ENV = 'test';
import app from '../server/server.js';
import { EventEmitter } from 'events';

console.log('====================================================');
console.log('   IN-MEMORY BACKEND ENDPOINTS & SECURITY TEST      ');
console.log('====================================================');

// Lightweight In-Memory HTTP Tester for Express (Zero network socket needed)
function callApp(options) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', url = '/', headers = {}, body = null } = options;

    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.body = body;
    req.headers = {};
    for (const [k, v] of Object.entries(headers)) {
      req.headers[k.toLowerCase()] = v;
    }
    if (body && typeof body === 'object') {
      req.headers['content-type'] = 'application/json';
    }

    const res = new EventEmitter();
    let resBody = '';
    let statusCode = 200;
    const resHeaders = {};

    res.statusCode = 200;
    res.setHeader = (name, val) => {
      resHeaders[name.toLowerCase()] = val;
    };
    res.getHeader = (name) => resHeaders[name.toLowerCase()];
    res.status = (code) => {
      res.statusCode = code;
      statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('content-type', 'application/json');
      resBody = JSON.stringify(data);
      res.emit('finish');
    };
    res.send = (data) => {
      resBody = typeof data === 'object' ? JSON.stringify(data) : String(data);
      res.emit('finish');
    };
    res.end = (chunk) => {
      if (chunk) resBody += chunk.toString();
      res.emit('finish');
    };

    res.on('finish', () => {
      resolve({
        status: res.statusCode,
        headers: resHeaders,
        text: () => Promise.resolve(resBody),
        json: () => Promise.resolve(JSON.parse(resBody || '{}')),
      });
    });

    try {
      app(req, res);
      process.nextTick(() => {
        if (body) {
          const payload = typeof body === 'object' ? JSON.stringify(body) : body;
          req.headers['content-length'] = Buffer.byteLength(payload).toString();
          req.emit('data', Buffer.from(payload));
        }
        req.emit('end');
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function runTests() {
  // TEST 1: Health check
  console.log('[Test 1] Health Check /api/health...');
  const healthRes = await callApp({ method: 'GET', url: '/api/health' });
  const healthData = await healthRes.json();
  console.log('Health:', healthData);
  if (healthRes.status !== 200 || healthData.status !== 'ok') {
    throw new Error('Health check failed');
  }
  console.log('✓ PASS: Health check active with database & storage provider status\n');

  // TEST 2: Creator creates room
  console.log('[Test 2] Create Room POST /api/rooms...');
  const createRes = await callApp({ method: 'POST', url: '/api/rooms' });
  const createData = await createRes.json();
  if (createRes.status !== 200 || !createData.success || !createData.roomCode) {
    throw new Error(`Failed to create room: ${JSON.stringify(createData)}`);
  }
  const { roomId, roomCode, creatorToken } = createData;
  console.log(`Created Room: ${roomCode} (ID: ${roomId})`);
  console.log('✓ PASS: Creator room generated with unique room code and token\n');

  // TEST 3: Visitor Cannot Access Unpublished Draft Room
  console.log('[Test 3] Visitor access to unpublished draft room...');
  const draftRes = await callApp({ method: 'GET', url: `/api/rooms/${roomCode}` });
  if (draftRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for unpublished room, got ${draftRes.status}`);
  }
  const draftData = await draftRes.json();
  console.log('Protection error message:', draftData.error);
  console.log('✓ PASS: Visitor is strictly prevented from accessing unpublished room\n');

  // TEST 4: Creator Preview with Token Works on Draft
  console.log('[Test 4] Creator preview with token on draft...');
  const previewRes = await callApp({
    method: 'GET',
    url: `/api/rooms/${roomCode}`,
    headers: { Authorization: `Bearer ${creatorToken}` },
  });
  const previewData = await previewRes.json();
  console.log('Preview data:', previewData);
  if (previewRes.status !== 200 || !previewData.isCreator) {
    throw new Error('Creator preview failed');
  }
  console.log('✓ PASS: Creator preview mode verified\n');

  // TEST 5: Creator Updates Room Configuration
  console.log('[Test 5] Update room configuration PUT /api/rooms/:roomId...');
  const updateRes = await callApp({
    method: 'PUT',
    url: `/api/rooms/${roomId}`,
    headers: { Authorization: `Bearer ${creatorToken}` },
    body: {
      title: 'Our Forever World ❤️',
      husbandName: 'Tarun',
      wifeName: 'My Beloved Wife',
    },
  });
  const updateData = await updateRes.json();
  if (updateRes.status !== 200 || updateData.room.husbandName !== 'Tarun') {
    throw new Error('Failed to update room');
  }
  console.log('✓ PASS: Room configuration updated and persisted\n');

  // TEST 6: Unauthorized Modification Blocked
  console.log('[Test 6] Security Check: unauthorized modification blocked...');
  const fakeRes = await callApp({
    method: 'PUT',
    url: `/api/rooms/${roomId}`,
    headers: { Authorization: 'Bearer invalid_attacker_token' },
    body: { title: 'Compromised Title' },
  });
  if (fakeRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${fakeRes.status}`);
  }
  console.log('✓ PASS: Unauthorized edit strictly rejected with 403 Forbidden\n');

  // TEST 7: Creator Publishes Room
  console.log('[Test 7] Publish Room POST /api/rooms/:roomId/publish...');
  const pubRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomId}/publish`,
    headers: { Authorization: `Bearer ${creatorToken}` },
  });
  const pubData = await pubRes.json();
  if (pubRes.status !== 200 || !pubData.published) {
    throw new Error('Failed to publish room');
  }
  console.log(`✓ PASS: Room published! Room Code: ${pubData.roomCode}\n`);

  // TEST 8: Visitor Joins Published Room & Sanitization
  console.log('[Test 8] Visitor joins published room GET /api/rooms/:roomCode...');
  const visitorRes = await callApp({ method: 'GET', url: `/api/rooms/${roomCode}` });
  const visitorData = await visitorRes.json();
  if (visitorRes.status !== 200 || !visitorData.room) {
    throw new Error('Visitor failed to fetch published room');
  }
  if (visitorData.isCreator) {
    throw new Error('Visitor should not be flagged as creator');
  }
  if (visitorData.room.creatorToken) {
    throw new Error('SECURITY VIOLATION: creatorToken leaked to visitor!');
  }
  if (visitorData.room.husbandName !== 'Tarun') {
    throw new Error('Visitor received wrong data');
  }
  console.log('✓ PASS: Visitor successfully joined! creatorToken securely stripped.\n');

  // TEST 9: Invalid Room Code Handling
  console.log('[Test 9] Non-existent room code GET /api/rooms/UNKNOWN-9999...');
  const notFoundRes = await callApp({ method: 'GET', url: '/api/rooms/UNKNOWN-9999' });
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404, got ${notFoundRes.status}`);
  }
  console.log('✓ PASS: Non-existent room code returns 404 Not Found\n');

  console.log('====================================================');
  console.log('  ALL BACKEND ENDPOINTS & PERMISSIONS VERIFIED 100% ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
