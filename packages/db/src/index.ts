import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (!connectionString && process.env.MYSQLHOST) {
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT || "3306";
  const user = process.env.MYSQLUSER || "root";
  const password = process.env.MYSQLPASSWORD || "";
  const database = process.env.MYSQLDATABASE || "luxestore";
  connectionString = `mysql://${user}:${password}@${host}:${port}/${database}`;
}

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or MYSQLHOST environment variable is required.",
  );
}

export const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
