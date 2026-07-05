import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env") });

import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function waitAndConnectDb(retries = 10, delayMs = 3000): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      // Test the pool connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      logger.info("Successfully connected and pinged the database.");
      return;
    } catch (err) {
      logger.warn(
        { err, attempt: i, retries },
        `Database connection attempt failed. Retrying in ${delayMs / 1000}s...`
      );
      if (i === retries) {
        throw new Error("Could not connect to the database after maximum retries.");
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  try {
    await waitAndConnectDb();
    
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening on port");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

main();
