// prisma/seed.ts
import { hash } from "bcrypt";
import { prisma } from "../lib/prisma";

async function main() {
  const password = await hash("admin123", 10);  // ✔ contraseña inicial
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador",
      role: "ADMIN",
      hashedPassword: password,
    },
  });

  // No se crean tickets demo para mantener la base limpia
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
