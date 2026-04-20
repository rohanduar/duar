import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function upsertUser(params: {
  name: string;
  email: string;
  role: string;
  school_id: string | null;
  hashedPassword: string;
}) {
  const { name, email, role, school_id, hashedPassword } = params;

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      school_id,
      password: hashedPassword,
    },
    create: {
      name,
      email,
      role,
      school_id,
      password: hashedPassword,
    },
  });
}

async function main() {
  const hashedPassword = await hash("password123", 12);

  const existingSchool = await prisma.school.findFirst({
    where: { name: "Demo School" },
  });

  const school =
    existingSchool ??
    (await prisma.school.create({
      data: {
        name: "Demo School",
      },
    }));

  await upsertUser({
    name: "Super Admin",
    email: "superadmin@system.com",
    role: "super_admin",
    school_id: null,
    hashedPassword,
  });

  await upsertUser({
    name: "School Admin",
    email: "admin@school.co.id",
    role: "admin",
    school_id: school.school_id,
    hashedPassword,
  });

  await upsertUser({
    name: "Teacher Demo",
    email: "12345678@school.co.id",
    role: "teacher",
    school_id: school.school_id,
    hashedPassword,
  });

  await upsertUser({
    name: "Student Demo",
    email: "87654321@school.co.id",
    role: "student",
    school_id: school.school_id,
    hashedPassword,
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
