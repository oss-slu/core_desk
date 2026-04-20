import { defineConfig } from "cypress";
import { yamlPreprocessor, registerCommand, loadYaml } from "cypress-yaml-plugin";
import dotenv from "dotenv";
import { z } from "zod";
import prisma from "../api/util/prisma.js";
import jwt from "jsonwebtoken";
dotenv.config({ path: "./docker/.env.e2e" });
dotenv.config({ path: "../api/.env" });
const baseUrl = "http://localhost:5173";
import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

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

function redactDbUrl(dbUrl) {
  try {
    const url = new URL(dbUrl);
    if (url.password) {
      url.password = "***";
    }
    return url.toString();
  } catch (error) {
    return dbUrl;
  }
}

function runPsql(dbUrl, args, context) {
  const sanitizedDbUrl = sanitizeDbUrlForPsql(dbUrl);
  const psqlArgs = ["-v", "ON_ERROR_STOP=1", "-X", ...args, sanitizedDbUrl];
  const result = spawnSync("psql", psqlArgs, {
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
    const details = [stderr, stdout].filter(Boolean).join("\n") || "no output";
    const contextDetails = context ? ` (${context})` : "";
    throw new Error(
      [
        `psql command failed${contextDetails} with exit code ${result.status}.`,
        `Database: ${redactDbUrl(sanitizedDbUrl)}`,
        `Command: psql ${[
          ...psqlArgs.slice(0, -1),
          redactDbUrl(psqlArgs[psqlArgs.length - 1]),
        ].join(" ")}`,
        details,
      ].join("\n"),
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

function runSqlMigrations(dbUrl) {
  const migrationsDir = path.resolve(currentDir, "../api/prisma/migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Prisma migrations directory not found: ${migrationsDir}`);
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      file: path.resolve(migrationsDir, entry.name, "migration.sql"),
    }))
    .filter(({ file }) => fs.existsSync(file))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (migrationFiles.length === 0) {
    throw new Error(`No migration.sql files found in ${migrationsDir}`);
  }

  for (const migration of migrationFiles) {
    runPsql(
      dbUrl,
      ["-f", migration.file],
      `apply migration ${migration.name}`,
    );
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

  return path.resolve(currentDir, "cypress", relativePath);
}

export default defineConfig({
  e2e: {
    video: true,
    
    setupNodeEvents(on) {
      yamlPreprocessor(on);
      const runSeed = (relativeSqlPath, triggerLabel = "task") => {
        const dbUrl = process.env.DATABASE_URL;

        if (!dbUrl) {
          throw new Error("DATABASE_URL env variable must be set for db:seed");
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

        const startedAtMs = Date.now();
        console.log(
          `[e2e][db:seed] Starting seed (${triggerLabel}): ${sqlFilePath} -> ${redactDbUrl(dbUrl)}`,
        );

        try {
          ensureDatabaseExists(dbUrl);
          runPsql(
            dbUrl,
            ["-c", "DROP SCHEMA IF EXISTS public CASCADE"],
            "drop schema",
          );
          runPsql(dbUrl, ["-c", "CREATE SCHEMA public"], "create schema");
          runSqlMigrations(dbUrl);
          const seedOutput = runPsql(
            dbUrl,
            ["-f", sqlFilePath],
            `seed file ${sqlFilePath}`,
          );
          if (seedOutput) {
            console.log(`[e2e][db:seed] psql output:\n${seedOutput}`);
          } else {
            console.log(
              `[e2e][db:seed] psql output: <empty stdout from seed file>`,
            );
          }

          const userCount = runPsql(
            dbUrl,
            ['-tAc', 'SELECT COUNT(*) FROM "user"'],
            "post-seed user count",
          );
          console.log(`[e2e][db:seed] user rows after seed: ${userCount}`);

          const durationMs = Date.now() - startedAtMs;
          console.log(
            `[e2e][db:seed] Completed seed in ${durationMs}ms: ${sqlFilePath}`,
          );
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[e2e][db:seed] FAILED: ${sqlFilePath}\n${message}`);
          throw new Error(
            `[e2e][db:seed] Seed failed for ${relativeSqlPath}. See error output above.`,
          );
        }
      };

      on("task", {
        "db:seed": (relativeSqlPath) => runSeed(relativeSqlPath, "cy.task"),
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
            const [userCount, dbUrl] = await Promise.all([
              prisma.user.count(),
              Promise.resolve(process.env.DATABASE_URL || "<missing>"),
            ]);
            throw new Error(
              [
                `User not found: ${email}`,
                `[e2e][auth] user table row count: ${userCount}`,
                `[e2e][auth] DATABASE_URL: ${redactDbUrl(dbUrl)}`,
                `[e2e][auth] This usually means db:seed did not run or seeded a different database.`,
              ].join("\n"),
            );
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

      on("before:spec", async (spec) => {
        if (!spec?.absolute || !/\.ya?ml$/i.test(spec.absolute)) {
          return;
        }

        const loadedSpec = await loadYaml(spec.absolute);
        const seedFile = loadedSpec?.data?.seedFile;
        if (!seedFile) {
          return;
        }

        const specLabel = spec.relative || spec.absolute;
        console.log(
          `[e2e][db:seed] before:spec found seedFile for ${specLabel}: ${seedFile}`,
        );
        runSeed(seedFile, `before:spec ${specLabel}`);
      });
    },
    specPattern: "tests/**/*.yaml",
    baseUrl,
    supportFile: false,
  },
});
