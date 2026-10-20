
require("dotenv").config({ path: ".env" });
require("dotenv").config({
  path: ".env.local",
  override: true,
});

const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const email = (
      await rl.question("Account email: ")
    ).trim().toLowerCase();

    const user = await prisma.portalUser.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        isActive: true,
      },
    });

    if (!user) {
      throw new Error("Account not found.");
    }

    const password = await rl.question(
      "Temporary test password (visible): "
    );

    if (password.length < 12) {
      throw new Error(
        "Password must be at least 12 characters."
      );
    }

    const confirmation = await rl.question(
      "Confirm test password: "
    );

    if (password !== confirmation) {
      throw new Error("Passwords do not match.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.portalUser.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(
      `Password configured for ${user.name}.`
    );
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
