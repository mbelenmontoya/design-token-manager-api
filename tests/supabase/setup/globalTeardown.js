export default async () => {
  if (global.__SERVER_PID__) {
    try { process.kill(global.__SERVER_PID__); } catch {}
  }
};

