export default async () => {
  if (global.__SERVER_PID__) {
    try { process.kill(global.__SERVER_PID__); } catch {}
  }
  try {
    const { default: prisma } = await import('../../../src/config/prisma.js');
    await prisma.$disconnect();
  } catch (_) {}
};
