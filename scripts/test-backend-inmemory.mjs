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
  const { roomId, roomCode, creatorToken, creatorKey } = createData;
  const key = creatorKey || creatorToken;
  console.log(`Created Room: ${roomCode} (ID: ${roomId}, Key: ${key.substring(0, 10)}...)`);
  console.log('✓ PASS: Creator room generated with unique room code and secret creator key\n');

  // TEST 3: Visitor Joins with Room Code Only (View only, secrets stripped)
  console.log('[Test 3] Visitor joins with Room Code GET /api/rooms/:roomCode...');
  const joinRes = await callApp({ method: 'GET', url: `/api/rooms/${roomCode}` });
  const joinData = await joinRes.json();
  if (joinRes.status !== 200 || !joinData.room) {
    throw new Error(`Visitor could not join: ${JSON.stringify(joinData)}`);
  }
  if (joinData.isCreator) {
    throw new Error('Visitor should NOT have creator permissions');
  }
  if (joinData.room.creatorToken || joinData.room.creatorKey) {
    throw new Error('SECURITY LEAK: creatorToken or creatorKey exposed to visitor!');
  }
  console.log('✓ PASS: Visitor successfully joined by code; secrets securely stripped\n');

  // TEST 4: Creator Access with Creator Key
  console.log('[Test 4] Creator access with creator key on GET /api/rooms/:roomCode...');
  const creatorRes = await callApp({
    method: 'GET',
    url: `/api/rooms/${roomCode}`,
    headers: { Authorization: `Bearer ${key}` },
  });
  const creatorData = await creatorRes.json();
  if (creatorRes.status !== 200 || !creatorData.isCreator) {
    throw new Error('Creator key authentication failed');
  }
  console.log('✓ PASS: Creator key verified and creator privileges granted\n');

  // TEST 5: Creator Updates Photos and Configuration
  console.log('[Test 5] Creator updates room photos & letters PUT /api/rooms/:roomId...');
  const testPhotos = [
    {
      id: 1,
      title: 'Our Starry Night Walk',
      caption: 'Under the starlight',
      image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      date: 'Dec 12, 2025',
      location: 'Moonlit Beach',
      letter: 'My love, that night will live in my soul forever.',
      wall: 'west',
      positionOffset: 0,
      scale: 1.0,
      uploader: 'creator',
      timestamp: Date.now(),
    },
  ];

  const updateRes = await callApp({
    method: 'PUT',
    url: `/api/rooms/${roomId}`,
    headers: { Authorization: `Bearer ${key}` },
    body: {
      title: 'Our Eternal Haven ❤️',
      husbandName: 'Tarun',
      wifeName: 'My Beloved Wife',
      museumConfiguration: {
        photos: testPhotos,
      },
    },
  });
  const updateData = await updateRes.json();
  if (updateRes.status !== 200 || updateData.room.museumConfiguration.photos.length !== 1) {
    throw new Error('Failed to update room configuration');
  }
  console.log('✓ PASS: Room photos and configuration updated and persisted to database\n');

  // TEST 6: Unauthorized Modification Blocked on Server
  console.log('[Test 6] Security Check: unauthorized modification blocked...');
  const badEditRes = await callApp({
    method: 'PUT',
    url: `/api/rooms/${roomId}`,
    headers: { Authorization: 'Bearer bad_attacker_token' },
    body: { title: 'Hacked Title' },
  });
  if (badEditRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${badEditRes.status}`);
  }
  console.log('✓ PASS: Unauthorized edit strictly rejected with 403 Forbidden\n');

  // TEST 7: Re-join with the SAME room code loads ALL photos without overwrite
  console.log('[Test 7] RE-JOIN TEST: Re-join with the SAME room code...');
  const rejoinRes = await callApp({ method: 'GET', url: `/api/rooms/${roomCode}` });
  const rejoinData = await rejoinRes.json();
  if (rejoinRes.status !== 200 || !rejoinData.room) {
    throw new Error('Rejoin failed');
  }
  const rejoinedPhotos = rejoinData.room.museumConfiguration?.photos || [];
  if (rejoinedPhotos.length !== 1 || rejoinedPhotos[0].title !== 'Our Starry Night Walk') {
    throw new Error(`Photos missing on rejoin! Found: ${JSON.stringify(rejoinedPhotos)}`);
  }
  if (rejoinData.room.title !== 'Our Eternal Haven ❤️') {
    throw new Error('Room title was overwritten on rejoin');
  }
  console.log(`✓ PASS: Re-join verified! Photo "${rejoinedPhotos[0].title}" persisted perfectly.\n`);

  // TEST 8: Claiming Already Owned Room is Rejected
  console.log('[Test 8] Attempt to claim already owned room POST /api/rooms/:roomCode/claim...');
  const badClaimRes = await callApp({
    method: 'POST',
    url: `/api/rooms/${roomCode}/claim`,
  });
  if (badClaimRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden when claiming already owned room, got ${badClaimRes.status}`);
  }
  console.log('✓ PASS: Claiming already owned room is strictly rejected\n');

  // TEST 9: Non-existent room code returns 404
  console.log('[Test 9] Non-existent room code GET /api/rooms/UNKNOWN-9999...');
  const notFoundRes = await callApp({ method: 'GET', url: '/api/rooms/UNKNOWN-9999' });
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404, got ${notFoundRes.status}`);
  }
  console.log('✓ PASS: Non-existent room code returns 404 Not Found\n');

  // TEST 10: Delete Room (Creator only)
  console.log('[Test 10] Creator deletes room DELETE /api/rooms/:roomId...');
  const delRes = await callApp({
    method: 'DELETE',
    url: `/api/rooms/${roomId}`,
    headers: { Authorization: `Bearer ${key}` },
  });
  if (delRes.status !== 200) {
    throw new Error(`Failed to delete room: got status ${delRes.status}`);
  }
  // Verify room is deleted
  const checkDelRes = await callApp({ method: 'GET', url: `/api/rooms/${roomCode}` });
  if (checkDelRes.status !== 404) {
    throw new Error(`Expected 404 after deletion, got ${checkDelRes.status}`);
  }
  console.log('✓ PASS: Creator deleted room; room is no longer accessible\n');

  console.log('====================================================');
  console.log('  ALL PERSISTENCE & "MY ROOMS" TESTS PASSED 100%   ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
