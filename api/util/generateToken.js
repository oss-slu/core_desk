// tools/generateToken.mjs
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "#prisma";
import inquirer from "inquirer";
import ora from "ora";
import { createUser } from "./createUser.js";

dotenv.config();

const DEFAULT_EXPIRY = "24h";

/** Create a signed JWT for a given user record (non-admin assumption) */
export const generateToken = (user, { expiresIn = DEFAULT_EXPIRY } = {}) => {
  if (!process.env.JWT_SECRET)
    throw new Error("Missing JWT_SECRET in environment.");
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      // Do NOT embed any admin/role claims here unless your app requires it.
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

export const fetchUsers = async () => {
  const spinner = ora("Loading users...").start();
  try {
    const users = await prisma.user.findMany({});
    spinner.succeed(
      `Loaded ${users.length} user${users.length === 1 ? "" : "s"}.`
    );
    return users;
  } catch (err) {
    spinner.fail("Failed to load users.");
    throw err;
  }
};

/** Interactively create a new user (assumes standard fields; no admin by default) */
export const createUserInteractive = async () => {
  console.log("\n➕ Create a New User\n");

  const base = await inquirer.prompt([
    {
      type: "input",
      name: "firstName",
      message: "First name:",
      validate: (v) => (v?.trim() ? true : "First name is required."),
    },
    {
      type: "input",
      name: "lastName",
      message: "Last name:",
      validate: (v) => (v?.trim() ? true : "Last name is required."),
    },
    {
      type: "input",
      name: "email",
      message: "Email:",
      filter: (v) => v.trim().toLowerCase(),
      validate: (v) =>
        /^\S+@\S+\.\S+$/.test(v) ? true : "Enter a valid email address.",
    },
  ]);

  const spinner = ora("Creating user...").start();
  try {
    // Assumes your Prisma schema sets sensible defaults (e.g., role = "USER") if applicable.
    const user = await createUser(
      {
        firstName: base.firstName.trim(),
        lastName: base.lastName.trim(),
        email: base.email,
      },
      false
    );

    spinner.succeed(
      `Created user ${user.firstName} ${user.lastName} (${user.id}).`
    );
    return user;
  } catch (err) {
    spinner.fail("Failed to create user.");
    throw err;
  }
};

/** Pick an existing user or create new, then emit a JWT and a login snippet (24h expiry, non-admin) */
export const generateTokenForUser = async () => {
  if (!process.env.JWT_SECRET)
    throw new Error("Missing JWT_SECRET in environment.");

  const users = await fetchUsers();

  const CHOICE_CREATE = "__CREATE_USER__";
  const { selection } = await inquirer.prompt([
    {
      type: "list",
      name: "selection",
      message: "Select a user or create a new one",
      pageSize: 12,
      choices: [
        { name: "➕ Create a new user", value: CHOICE_CREATE },
        ...users.map((u) => ({
          name: `${u.firstName} ${u.lastName} <${u.email}> (${u.id})`,
          value: u.id,
        })),
      ],
    },
  ]);

  let user;
  if (selection === CHOICE_CREATE) {
    user = await createUserInteractive();
  } else {
    const spinner = ora("Fetching selected user...").start();
    user = await prisma.user.findUnique({ where: { id: selection } });
    spinner.stop();
    if (!user) {
      console.error("Selected user not found.");
      process.exit(1);
    }
  }

  const token = generateToken(user, { expiresIn: DEFAULT_EXPIRY });

  console.log(
    `\nPaste the following into your browser's console to set the token (valid ${DEFAULT_EXPIRY}) and log in as ${user.firstName} ${user.lastName}:\n\nlocalStorage.setItem("token", "${token}");document.location.reload()\n`
  );
};

export const main = async () => {
  try {
    await generateTokenForUser();
  } catch (err) {
    console.error(err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
