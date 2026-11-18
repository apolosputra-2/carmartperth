
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const rl = readline.createInterface({ input: stdin, output: stdout });

function quoteIdentifier(value) {
  return '"' + value.replace(/"/g, '""') + '"';
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });

  try {
    const email = (
      await rl.question("Enter account email to DELETE: ")
    ).trim().toLowerCase();

    if (!email) {
      throw new Error("Email is required.");
    }

    const user = await prisma.portalUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("Account not found. No changes made.");
      return;
    }

    console.log("\nAccount found:");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("ID:", user.id);

    // Inspect all single-column database foreign keys referencing PortalUser.
    const references = await prisma.$queryRaw`
      SELECT
        n.nspname AS "schemaName",
        t.relname AS "tableName",
        a.attname AS "columnName",
        cardinality(fk.conkey)::int AS "keyColumns"
      FROM pg_constraint fk
      JOIN pg_class t ON t.oid = fk.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a
        ON a.attrelid = fk.conrelid
        AND a.attnum = fk.conkey[1]
      WHERE fk.contype = 'f'
        AND fk.confrelid = '"PortalUser"'::regclass
    `;

    const linked = [];

    for (const ref of references) {
      if (ref.keyColumns !== 1) {
        throw new Error(
          "Complex foreign key detected. Deletion blocked."
        );
      }

      const table =
        quoteIdentifier(ref.schemaName) + "." +
        quoteIdentifier(ref.tableName);

      const column = quoteIdentifier(ref.columnName);

      const rows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS count
         FROM ${table}
         WHERE ${column} = $1`,
        user.id
      );

      if (rows[0].count > 0) {
        linked.push({
          table: ref.tableName,
          count: rows[0].count,
        });
      }
    }

    if (linked.length > 0) {
      console.log("\nDELETE BLOCKED: Account has linked records.");

      for (const item of linked) {
        console.log(`${item.table}: ${item.count} record(s)`);
      }

      console.log(
        "\nPreserve this account and its history. No changes made."
      );
      return;
    }

    console.log("\nWARNING: This action permanently deletes the account.");
    console.log("The account must be recreated to use it again.");

    const confirmation = await rl.question(
      `Type DELETE ${email} to confirm: `
    );

    if (confirmation !== `DELETE ${email}`) {
      console.log("Cancelled. No changes made.");
      return;
    }

    await prisma.portalUser.delete({
      where: { id: user.id },
    });

    console.log("\nAccount deleted successfully.");
    console.log("Email can now be used for a new account.");
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("Deletion failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
