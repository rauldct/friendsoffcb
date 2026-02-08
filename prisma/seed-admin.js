const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();

  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD || "FoB2026Admin!";

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: { password: hash },
    create: {
      username,
      password: hash,
      name: "Admin",
    },
  });

  console.log(`Admin user '${user.username}' seeded (id: ${user.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
