const cluster = require('cluster');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const app = express();

// Menghindari peringatan memory leak
process.setMaxListeners(0);

// Express.js 
const ports = [4000, 3000, 5000, 8000];
let availablePortIndex = 0;

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      server.close();
      resolve(true);
    });
    server.on('error', reject);
  });
}

async function startServer() {
  const port = ports[availablePortIndex];
  try {
    const isPortAvailable = await checkPort(port);
    if (isPortAvailable) {
      console.log('\x1b[33m%s\x1b[0m', `🌐 Port ${port} is open`);
      app.get('/', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const data = {
          status: 'true',
          message: 'Bot Successfully Activated!',
          author: 'VieleytaZen',
        };
        res.send(JSON.stringify({ response: data }, null, 2));
      });
    }
  } catch (e) {
    availablePortIndex++;
    if (availablePortIndex < ports.length) startServer();
  }
}

startServer();

let isRunning = false;

function start(file) {
  if (isRunning) return;
  isRunning = true;

  const args = [path.join(__dirname, file), ...process.argv.slice(2)];
  const p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  p.on("message", (data) => {
    console.log('\x1b[36m%s\x1b[0m', `🟢 RECEIVED ${data}`);
    switch (data) {
      case "reset":
        p.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case "uptime":
        p.send(process.uptime());
        break;
    }
  });

  p.on("exit", (code) => {
    isRunning = false;
    console.error('\x1b[31m%s\x1b[0m', `Exited with code: ${code}`);
    
    if (code === 0) return;

    fs.unwatchFile(args[0]);
    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0]);
      console.error('\x1b[31m%s\x1b[0m', `File ${args[0]} modified. Restarting...`);
      start(file);
    });

    setTimeout(() => start(file), 5000);
  });

  p.on("error", (err) => {
    console.error('\x1b[31m%s\x1b[0m', `Error: ${err}`);
    p.kill();
    isRunning = false;
  });
}

start('main.js');

const tmpDir = './tmp';
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
    console.log('\x1b[33m%s\x1b[0m', `📁 Created directory ${tmpDir}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31m%s\x1b[0m', `Unhandled promise rejection: ${reason}`);
});
