import { env, assertEnv } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";

const start = async () => {
  try {
    assertEnv();

    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.port, () => {
      console.log(
        `[server] GEARS API listening on http://localhost:${env.port} (${env.nodeEnv})`
      );
    });

    const shutdown = (signal) => {
      console.log(`\n[server] ${signal} received, shutting down`);

      server.close(() => process.exit(0));

      /* Do not hang forever on stuck connections. */
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[server] failed to start:", error.message);
    process.exit(1);
  }
};

start();
