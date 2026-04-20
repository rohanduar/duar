import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

async function getSuperAdminSession() {
  const session = await auth();
  if (!session || session.user.role !== "super_admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const schools = await prisma.school.findMany({
    orderBy: { created_at: "desc" },
    select: {
      school_id: true,
      name: true,
      is_active: true,
      created_at: true,
      users: {
        select: {
          role: true,
        },
      },
    },
  });

  const mapped = schools.map((school) => {
    const total_admins = school.users.filter((user) => user.role === "admin").length;
    const total_teachers = school.users.filter((user) => user.role === "teacher").length;
    const total_students = school.users.filter((user) => user.role === "student").length;
    return {
      school_id: school.school_id,
      name: school.name,
      is_active: school.is_active,
      created_at: school.created_at,
      total_admins,
      total_teachers,
      total_students,
    };
  });

  return NextResponse.json({ data: mapped });
}

export async function POST(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ message: "School name is required" }, { status: 400 });
  }

  const school = await prisma.school.create({
    data: { name },
    select: {
      school_id: true,
      name: true,
      is_active: true,
      created_at: true,
    },
  });

  await createActivityLog({
    action: "create",
    entity: "school",
    entity_id: school.school_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} created school ${school.name}`,
  });

  return NextResponse.json({ data: school }, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    school_id?: string;
    name?: string;
    is_active?: boolean;
  };
  const school_id = body.school_id?.trim();
  const name = body.name?.trim();
  const is_active = body.is_active;

  if (!school_id) {
    return NextResponse.json({ message: "school_id is required" }, { status: 400 });
  }

  if (!name && typeof is_active !== "boolean") {
    return NextResponse.json(
      { message: "name or is_active is required" },
      { status: 400 },
    );
  }

  const dataToUpdate: { name?: string; is_active?: boolean } = {};
  if (name) {
    dataToUpdate.name = name;
  }
  if (typeof is_active === "boolean") {
    dataToUpdate.is_active = is_active;
  }

  const school = await prisma.school.update({
    where: { school_id },
    data: dataToUpdate,
    select: {
      school_id: true,
      name: true,
      is_active: true,
      created_at: true,
    },
  });

  await createActivityLog({
    action: "update",
    entity: "school",
    entity_id: school.school_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description:
      typeof is_active === "boolean"
        ? `${session.user.name} ${is_active ? "enabled" : "disabled"} school ${school.name}`
        : `${session.user.name} updated school ${school.name}`,
  });

  return NextResponse.json({ data: school });
}

export async function DELETE(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { school_id?: string };
  const school_id = body.school_id?.trim();

  if (!school_id) {
    return NextResponse.json({ message: "school_id is required" }, { status: 400 });
  }

  const school = await prisma.school.delete({
    where: { school_id },
    select: {
      school_id: true,
      name: true,
    },
  });

  await createActivityLog({
    action: "delete",
    entity: "school",
    entity_id: school.school_id,
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    },
    description: `${session.user.name} deleted school ${school.name}`,
  });

  return NextResponse.json({ message: "School deleted" });
}
