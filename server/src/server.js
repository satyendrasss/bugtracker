import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/prisma.js";

const port = Number(process.env.PORT) || 8080;
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters.");
}
const server = app.listen(port, () => {
  console.log(`BugTracker API listening at http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
