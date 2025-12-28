import { exec, type ChildProcess } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FirebaseEmulator {
  private process: ChildProcess | null = null;

  async start() {
    console.log('🚀 Starting Firebase Emulator...');
    this.process = exec('firebase emulators:start --only auth,firestore');

    // Log emulator output
    this.process.stdout?.on('data', (data: string) => {
      if (data.includes('All emulators ready')) {
        console.log('✅ Firebase Emulator ready');
      }
    });

    this.process.stderr?.on('data', (data: string) => {
      console.error('Emulator error:', data);
    });

    // Wait for emulator to be ready
    await this.waitForEmulator();
  }

  async stop() {
    if (this.process) {
      console.log('🛑 Stopping Firebase Emulator...');
      this.process.kill();
    }
  }

  async clear() {
    console.log('🧹 Clearing emulator data...');
    try {
      // Clear Firestore
      await execAsync(
        'curl -X DELETE "http://localhost:8080/emulator/v1/projects/demo-project/databases/(default)/documents"'
      );

      // Clear Auth
      await execAsync(
        'curl -X DELETE "http://localhost:9099/emulator/v1/projects/demo-project/accounts"'
      );

      console.log('✅ Emulator data cleared');
    } catch (error) {
      console.error('Failed to clear emulator:', error);
    }
  }

  private async waitForEmulator(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await execAsync('curl -s http://localhost:8080');
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Firebase Emulator failed to start');
  }
}
