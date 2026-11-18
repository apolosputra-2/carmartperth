
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { randomUUID } = require("node:crypto");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  const name = (await rl.question("Full name: ")).trim();
  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const role = (await rl.question("Role (STAFF/BOSS/BROKER): "))
    .trim().toUpperCase();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid name and email are required.");
  }

  if (!["STAFF", "BOSS", "BROKER"].includes(role)) {
    throw new Error("Invalid role.");
  }

  const existing = await prisma.portalUser.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const id = "c" + randomUUID().replace(/-/g, "");

  const user = await prisma.portalUser.create({
    data: {
      id,
      name,
      email,
      role,
      isActive: true,
    },
  });

  if (!user.id) {
    throw new Error("Account was created without an ID.");
  }

  console.log("\nAccount created successfully!");
  console.log("ID:", user.id);
  console.log("Name:", user.name);
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("\nNext: configure the account password.");
}

main()
  .catch((error) => {
    console.error("Account creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
