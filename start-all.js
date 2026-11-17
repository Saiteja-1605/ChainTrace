const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = __dirname;
const BLOCKCHAIN_DIR = path.join(ROOT_DIR, "blockchain");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");

const isWin = process.platform === "win32";
const NPX_CMD = isWin ? "npx.cmd" : "npx";
const NPM_CMD = isWin ? "npm.cmd" : "npm";

const children = [];

function log(prefix, message, color = "\x1b[36m") {
  const reset = "\x1b[0m";
  console.log(`${color}[${prefix}]${reset} ${message}`);
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (isWin) {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch (e) {
    // Process already terminated or permission denied
  }
}

/**
 * Check if a port is in use on Windows/Linux
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http
      .createServer()
      .listen(port, "0.0.0.0", () => {
        server.close(() => resolve(false));
      })
      .on("error", () => resolve(true));
  });
}

/**
 * Check if Hardhat local RPC responds
 */
function checkRpcReady() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    });

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 8545,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 2000,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            resolve(res.statusCode === 200 && parsed.result !== undefined);
          } catch (e) {
            resolve(res.statusCode === 200);
          }
        });
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

/**
 * Check if Backend API health check responds
 */
function checkBackendReady() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 5000,
        path: "/api/health",
        method: "GET",
        timeout: 2000,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            resolve(res.statusCode === 200 && parsed.status === "online");
          } catch (e) {
            resolve(res.statusCode === 200);
          }
        });
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

/**
 * Check if Frontend development server responds
 */
function checkFrontendReady() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: "/",
        method: "GET",
        timeout: 2000,
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForCondition(checkFn, maxAttempts = 30, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkFn();
    if (ready) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

function spawnProcess(cmd, args, cwd, prefix, color) {
  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: "pipe",
    env: { ...process.env, FORCE_COLOR: "true" },
  });

  proc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const l of lines) {
      if (l.trim()) log(prefix, l.trim(), color);
    }
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const l of lines) {
      if (l.trim()) log(prefix, l.trim(), "\x1b[31m");
    }
  });

  proc.on("error", (err) => {
    log(prefix, `Process execution failed: ${err.message}`, "\x1b[31m");
  });

  children.push(proc);
  return proc;
}

async function run() {
  console.log("\x1b[1m\x1b[34m=================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[34m  ChainTrace – Local Blockchain Supply Chain Orchestrator        \x1b[0m");
  console.log("\x1b[1m\x1b[34m=================================================================\x1b[0m\n");

  // Step 1: Pre-flight check for lingering ports
  const port8545Busy = await isPortInUse(8545);
  const isRpcActive = port8545Busy ? await checkRpcReady() : false;

  if (port8545Busy && !isRpcActive) {
    log("ORCH", "Warning: Port 8545 is occupied by an unresponsive process. Attempting cleanup...", "\x1b[33m");
    if (isWin) {
      try {
        const out = execSync('netstat -ano | findstr :8545 | findstr LISTENING', { encoding: 'utf8' });
        const match = out.trim().split(/\s+/).pop();
        if (match && !isNaN(match)) killProcessTree(match);
      } catch (e) {}
    }
  }

  // Step 2: Start Hardhat Local Ethereum Blockchain
  if (!isRpcActive) {
    log("CHAIN", "Starting local Hardhat Ethereum node on http://127.0.0.1:8545...", "\x1b[35m");
    spawnProcess(NPX_CMD, ["hardhat", "node"], BLOCKCHAIN_DIR, "CHAIN", "\x1b[35m");

    log("CHAIN", "Waiting for Ethereum JSON-RPC node to become ready...", "\x1b[35m");
    const rpcReady = await waitForCondition(checkRpcReady, 40, 1000);
    if (!rpcReady) {
      log("CHAIN", "ERROR: Hardhat local blockchain failed to start on port 8545.", "\x1b[31m");
      cleanup();
      process.exit(1);
    }
    log("CHAIN", "✓ Hardhat local blockchain is active and responding on port 8545!", "\x1b[32m");
  } else {
    log("CHAIN", "✓ Detected existing active Hardhat node on http://127.0.0.1:8545", "\x1b[32m");
  }

  // Step 3: Deploy Smart Contract
  log("DEPLOY", "Deploying SupplyChain.sol to localhost network...", "\x1b[33m");
  try {
    execSync(`${NPX_CMD} hardhat run scripts/deploy.js --network localhost`, {
      cwd: BLOCKCHAIN_DIR,
      stdio: "inherit",
    });
    log("DEPLOY", "✓ Smart contract deployed and ABI/addresses auto-configured!", "\x1b[32m");
  } catch (err) {
    log("DEPLOY", `ERROR: Contract deployment failed: ${err.message}`, "\x1b[31m");
    cleanup();
    process.exit(1);
  }

  // Step 4: Seed initial on-chain demo products if database is fresh
  log("SEED", "Synchronizing demo products and cryptographic provenance hashes...", "\x1b[36m");
  try {
    execSync("node src/scripts/seed.js", {
      cwd: BACKEND_DIR,
      stdio: "inherit",
    });
    log("SEED", "✓ Demo products synchronized onto Hardhat blockchain!", "\x1b[32m");
  } catch (sErr) {
    log("SEED", `Notice during seeding: ${sErr.message}`, "\x1b[33m");
  }

  // Step 5: Start Backend Express Server
  const port5000Busy = await isPortInUse(5000);
  if (port5000Busy) {
    log("BACKEND", "Port 5000 in use, attempting to clear previous backend instance...", "\x1b[33m");
    if (isWin) {
      try {
        const out = execSync('netstat -ano | findstr :5000 | findstr LISTENING', { encoding: 'utf8' });
        const match = out.trim().split(/\s+/).pop();
        if (match && !isNaN(match)) killProcessTree(match);
      } catch (e) {}
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  log("BACKEND", "Starting Express server on http://localhost:5000...", "\x1b[36m");
  spawnProcess("node", ["src/server.js"], BACKEND_DIR, "BACKEND", "\x1b[36m");

  log("BACKEND", "Waiting for Backend health check (/api/health)...", "\x1b[36m");
  const backendReady = await waitForCondition(checkBackendReady, 30, 500);
  if (!backendReady) {
    log("BACKEND", "ERROR: Backend API failed to respond at http://localhost:5000/api/health", "\x1b[31m");
    cleanup();
    process.exit(1);
  }
  log("BACKEND", "✓ Backend API is online and communicating with Hardhat!", "\x1b[32m");

  // Step 6: Start React Vite Frontend
  const port3000Busy = await isPortInUse(3000);
  if (port3000Busy) {
    log("FRONTEND", "Port 3000 in use, attempting to clear previous frontend instance...", "\x1b[33m");
    if (isWin) {
      try {
        const out = execSync('netstat -ano | findstr :3000 | findstr LISTENING', { encoding: 'utf8' });
        const match = out.trim().split(/\s+/).pop();
        if (match && !isNaN(match)) killProcessTree(match);
      } catch (e) {}
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  log("FRONTEND", "Starting Vite development server on http://localhost:3000...", "\x1b[34m");
  spawnProcess(NPM_CMD, ["run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"], FRONTEND_DIR, "FRONTEND", "\x1b[34m");

  log("FRONTEND", "Waiting for Vite frontend to accept connections...", "\x1b[34m");
  const frontendReady = await waitForCondition(checkFrontendReady, 30, 500);
  if (!frontendReady) {
    log("FRONTEND", "ERROR: Frontend server failed to respond at http://localhost:3000", "\x1b[31m");
    cleanup();
    process.exit(1);
  }
  log("FRONTEND", "✓ Frontend development server is live!", "\x1b[32m");

  // Step 7: Final Verified Summary Banner
  console.log("\n\x1b[1m\x1b[32m=================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m  ALL CHAINTRACE SERVICES ARE VERIFIED AND RUNNING LOCALLY!       \x1b[0m");
  console.log("\x1b[1m\x1b[32m=================================================================\x1b[0m\n");
  console.log(`\x1b[1m  Frontend Application:\x1b[0m  \x1b[36mhttp://localhost:3000\x1b[0m`);
  console.log(`\x1b[1m  Public Verification:\x1b[0m   \x1b[36mhttp://localhost:3000/verify\x1b[0m`);
  console.log(`\x1b[1m  Backend REST API:\x1b[0m      \x1b[36mhttp://localhost:5000/api/health\x1b[0m`);
  console.log(`\x1b[1m  Local Hardhat RPC:\x1b[0m     \x1b[36mhttp://127.0.0.1:8545\x1b[0m\n`);
  console.log("\x1b[1mDemo Accounts (1-Click Fill on Login Page | Password: password123)\x1b[0m");
  console.log("  • Admin:        \x1b[33madmin@chaintrace.local\x1b[0m");
  console.log("  • Manufacturer: \x1b[33mmanufacturer@chaintrace.local\x1b[0m");
  console.log("  • Distributor:  \x1b[33mdistributor@chaintrace.local\x1b[0m");
  console.log("  • Retailer:     \x1b[33mretailer@chaintrace.local\x1b[0m\n");
  console.log("\x1b[90mPress Ctrl+C to stop all services cleanly.\x1b[0m\n");
}

function cleanup() {
  log("SHUTDOWN", "Stopping all ChainTrace processes...", "\x1b[31m");
  for (const proc of children) {
    if (proc && proc.pid) {
      killProcessTree(proc.pid);
    }
  }
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

run();
