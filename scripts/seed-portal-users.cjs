require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const accounts = [
  // STAFF
  { name: "Carlos Ferreira", role: "STAFF" },
  { name: "Maurice Pace Jnr", role: "STAFF" },
  { name: "Josh Gao", role: "STAFF" },
  { name: "Manny Ritti", role: "STAFF" },
  { name: "Apolos Putra", role: "STAFF" },

  // BOSS
  { name: "John Bucolo", role: "BOSS" },
  { name: "Maurice Pace", role: "BOSS" },

  // BROKERS
  { name: "Ashton Sime", role: "BROKER" },
  { name: "Chris Baisden", role: "BROKER" },
  { name: "Jack Anderson", role: "BROKER" },
  { name: "Tianhe Soutar", role: "BROKER" },
];

async function main() {
  for (const account of accounts) {
    const existing = await prisma.portalUser.findFirst({
      where: {
        name: account.name,
        role: account.role,
      },
    });

    if (existing) {
      console.log(`Already exists: ${account.name}`);
      continue;
    }

    await prisma.portalUser.create({
      data: account,
    });

    console.log(`Created: ${account.name}`);
  }

  console.log("Portal account seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
