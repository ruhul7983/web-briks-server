// prisma/seed.js
require("dotenv").config();

const prisma = require("../src/utils/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("🌱 Running seed...");

  const admins = [
    {
      name: "Mamun Admin",
      email: "mamun@webbriks.com",
      password: "M@Webbriks#2026!",
    },
    {
      name: "Asad Admin",
      email: "asad@webbriks.com",
      password: "A$Webbriks99",
    },
  ];

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {}, // keep existing user unchanged
      create: {
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`✅ Admin ready: ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
