#!/usr/bin/env node

/**
 * Check if Firebase Emulator is running before running E2E tests
 */

const http = require('http');

const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  ui: 4000,
};

function checkPort(port, name) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: port,
        method: 'GET',
        path: '/',
        timeout: 1000,
      },
      (res) => {
        resolve({ port, name, running: true });
      }
    );

    req.on('error', () => {
      resolve({ port, name, running: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ port, name, running: false });
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Checking Firebase Emulator status...\n');

  const checks = await Promise.all([
    checkPort(EMULATOR_PORTS.auth, 'Auth'),
    checkPort(EMULATOR_PORTS.firestore, 'Firestore'),
    checkPort(EMULATOR_PORTS.ui, 'UI'),
  ]);

  const allRunning = checks.every((c) => c.running);

  checks.forEach(({ name, port, running }) => {
    const status = running ? '✅' : '❌';
    console.log(`${status} ${name} Emulator (port ${port}): ${running ? 'Running' : 'Not running'}`);
  });

  console.log('');

  if (!allRunning) {
    console.error('❌ Firebase Emulator is not fully running!\n');
    console.error('To start the emulator, run:\n');
    console.error('  npm run emulator:start\n');
    console.error('Or in a separate terminal:\n');
    console.error('  firebase emulators:start --only auth,firestore\n');
    process.exit(1);
  } else {
    console.log('✅ Firebase Emulator is running and ready for E2E tests!\n');
    process.exit(0);
  }
}

main();
