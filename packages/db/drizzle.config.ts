import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

// Load root .env file manually if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, "../../.env");
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0) {
          const value = values.join("=").trim().replace(/^['"]|['"]$/g, "");
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (err) {
    console.error("Failed to load .env file:", err);
  }
}

let dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (!dbUrl && process.env.MYSQLHOST) {
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT || "3306";
  const user = process.env.MYSQLUSER || "root";
  const password = process.env.MYSQLPASSWORD || "";
  const database = process.env.MYSQLDATABASE || "luxestore";
  dbUrl = `mysql://${user}:${password}@${host}:${port}/${database}`;
  process.env.DATABASE_URL = dbUrl;
}

if (!dbUrl) {
  throw new Error("DATABASE_URL or MYSQLHOST, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
