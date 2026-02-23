import { defineConfig } from "cypress";
import { yamlPreprocessor, registerCommand } from "cypress-yaml-plugin";
import dotenv from "dotenv";
import { z } from "zod";
import prisma from "../api/util/prisma";
import jwt from "jsonwebtoken";
dotenv.config({ path: "./docker/.env.e2e" });
dotenv.config({ path: "../api/.env" });
const baseUrl = "http://localhost:3030";
import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";

registerCommand(
  "authenticateUser",
  (options) => {
    const encodedOptions = JSON.stringify(options);
    const emailLabel = JSON.stringify(options.email);

    return [
      `cy.task('authenticateUser', ${encodedOptions}).then((token) => {
        if (!token) {
          throw new Error('authenticateUser task returned invalid token');
        }

        cy.window().then((win) => {
          win.localStorage.setItem('token', token);
        });

        cy.log('Authenticated as ' + ${emailLabel});

        cy.reload();
      });`,
    ];
  },
  {
    schema: z.object({
      email: z.string().min(1, "email is required"),
    }),
  },
);

function sanitizeDbUrlForPsql(dbUrl) {
  try {
    const url = new URL(dbUrl);
    let mutated = false;

    if (url.searchParams.has("schema")) {
      url.searchParams.delete("schema");
      mutated = true;
    }

    return mutated ? url.toString() : dbUrl;
  } catch (error) {
    return dbUrl;
  }
}

function runPsql(dbUrl, args) {
  const sanitizedDbUrl = sanitizeDbUrlForPsql(dbUrl);
  const result = spawnSync("psql", [...args, sanitizedDbUrl], {
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const details = stderr || stdout || "no output from psql";
    throw new Error(
      `psql command failed with exit code ${result.status}: ${details}`,
    );
  }

  return (result.stdout || "").trim();
}

function getDbInfo(dbUrl) {
  const sanitizedDbUrl = sanitizeDbUrlForPsql(dbUrl);
  const url = new URL(sanitizedDbUrl);
  const dbName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

  if (!dbName) {
    throw new Error("DATABASE_URL must include a database name in the path");
  }

  const adminUrl = new URL(sanitizedDbUrl);
  adminUrl.pathname = "/postgres";

  return { dbName, adminDbUrl: adminUrl.toString() };
}

function ensureDatabaseExists(dbUrl) {
  const { dbName, adminDbUrl } = getDbInfo(dbUrl);
  const escapedLiteralDbName = dbName.replace(/'/g, "''");
  const escapedIdentifierDbName = dbName.replace(/"/g, '""');

  const exists = runPsql(adminDbUrl, [
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = '${escapedLiteralDbName}'`,
  ]);

  if (exists !== "1") {
    runPsql(adminDbUrl, ["-c", `CREATE DATABASE "${escapedIdentifierDbName}"`]);
  }
}

function runPrismaMigrate(dbUrl) {
  const prismaPath = path.resolve(__dirname, "../api/node_modules/.bin/prisma");

  const result = spawnSync(prismaPath, ["migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
    cwd: path.resolve(__dirname, "../api"),
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error("Prisma migrate deploy failed");
  }
}

function resolveSqlPath(relativePath) {
  if (!relativePath || typeof relativePath !== "string") {
    throw new Error(
      "db:seed expects the relative path to a SQL file, e.g. fixtures/account.sql",
    );
  }

  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return path.resolve(process.cwd(), "cypress", relativePath);
}

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      yamlPreprocessor(on);
      on("task", {
        "db:seed": (relativeSqlPath) => {
          const dbUrl = process.env.DATABASE_URL;

          if (!dbUrl) {
            throw new Error(
              "DATABASE_URL env variable must be set for db:seed",
            );
          }

          const isLocal =
            dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
          if (!isLocal) {
            throw new Error(
              "DATABASE_URL must point to localhost; refusing to seed remote database",
            );
          }

          const sqlFilePath = resolveSqlPath(relativeSqlPath);

          if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found: ${sqlFilePath}`);
          }

          ensureDatabaseExists(dbUrl);
          runPsql(dbUrl, ["-c", "DROP SCHEMA IF EXISTS public CASCADE"]);
          runPsql(dbUrl, ["-c", "CREATE SCHEMA public"]);
          runPrismaMigrate(dbUrl);
          runPsql(dbUrl, ["-f", sqlFilePath]);

          return null;
        },
        authenticateUser: async ({ email }) => {
          if (!process.env.JWT_SECRET) {
            throw new Error(
              "JWT_SECRET must be set to sign e2e auth tokens (check e2e/docker/.env.e2e)",
            );
          }

          const user = await prisma.user.findFirst({
            where: {
              email,
            },
          });

          if (!user) {
            throw new Error(`User not found: ${email}`);
          }

          return jwt.sign(
            {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            },
            process.env.JWT_SECRET,
            { expiresIn: "6h" },
          );
        },
      });
    },
    specPattern: "tests/**/*.yaml",
    baseUrl,
    supportFile: false,
  },
});
