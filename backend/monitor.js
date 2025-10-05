const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SecureFinance Backend Monitor...');

const serverPath = path.join(__dirname, 'server.js');
let serverProcess = null;
let restartCount = 0;
const maxRestarts = 10;

function startServer() {
  console.log(`🔄 Starting server (attempt ${restartCount + 1}/${maxRestarts})...`);

  serverProcess = spawn('node', [serverPath], {
    cwd: __dirname,
    stdio: 'inherit',
    detached: false
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`⚠️  Server exited with code ${code} and signal ${signal}`);

    if (code !== 0 && code !== null) {
      restartCount++;
      if (restartCount < maxRestarts) {
        console.log(`🔄 Restarting server in 5 seconds... (${restartCount}/${maxRestarts})`);
        setTimeout(startServer, 5000);
      } else {
        console.error('❌ Maximum restart attempts reached. Server monitoring stopped.');
        process.exit(1);
      }
    } else {
      console.log('✅ Server exited normally');
    }
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    restartCount++;
    if (restartCount < maxRestarts) {
      console.log(`🔄 Retrying server start in 5 seconds... (${restartCount}/${maxRestarts})`);
      setTimeout(startServer, 5000);
    } else {
      console.error('❌ Maximum restart attempts reached. Server monitoring stopped.');
      process.exit(1);
    }
  });
}

// Handle monitor process termination
process.on('SIGINT', () => {
  console.log('🛑 Monitor received SIGINT, stopping server...');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Monitor received SIGTERM, stopping server...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Start the server
startServer();

console.log('📊 Server monitor started. Press Ctrl+C to stop.');
console.log('🔗 Health check: http://localhost:3002/api/health');