const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Launching Social Report Studio (Server + Client)...\n');

// Detect platform command execution
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Start Server
const serverProcess = spawn(npmCmd, ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Client (Vite)
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n🛑 Shutting down server and client processes...');
  if (isWin) {
    if (serverProcess.pid) spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    if (clientProcess.pid) spawn('taskkill', ['/pid', clientProcess.pid, '/f', '/t']);
  } else {
    serverProcess.kill('SIGINT');
    clientProcess.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
