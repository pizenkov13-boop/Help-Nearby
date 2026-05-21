import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

for (const port of [3000, 3001]) {
  try {
    if (process.platform === "win32") {
      const out = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
      );
      const pids = new Set(
        out
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid)),
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        } catch {
          /* already stopped */
        }
      }
    } else {
      execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`, {
        shell: true,
        stdio: "ignore",
      });
    }
  } catch {
    /* port not in use */
  }
}

for (let attempt = 0; attempt < 5; attempt++) {
  try {
    rmSync(".next", {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 300,
    });
    break;
  } catch (err) {
    if (attempt === 4) throw err;
    try {
      execSync("ping -n 2 127.0.0.1 > nul", { stdio: "ignore", shell: true });
    } catch {
      /* ignore */
    }
  }
}
console.log("Stopped dev servers on 3000/3001 (if any) and removed .next");
