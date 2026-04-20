import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (
    !session ||
    (session.user.role !== "super_admin" && session.user.role !== "admin")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pageParam = Number(searchParams.get("page") || "1");
  const limitParam = Number(searchParams.get("limit") || "10");
  const role = searchParams.get("role")?.trim();
  const action = searchParams.get("action")?.trim();
  const search = searchParams.get("search")?.trim();
  const date = searchParams.get("date")?.trim();
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(100, Math.floor(limitParam))
      : 10;
  const where: Prisma.ActivityLogWhereInput = {};

  if (session.user.role === "admin") {
    const schoolUsers = await prisma.user.findMany({
      where: {
        school_id: session.user.school_id,
      },
      select: {
        name: true,
      },
    });
    const schoolUserNames = schoolUsers.map((user) => user.name);

    where.AND = [
      {
        role: {
          not: "super_admin",
        },
      },
      {
        user_name: {
          in: schoolUserNames,
        },
      },
    ];
  }

  if (role && role !== "all") {
    where.role = role;
  }
  if (action && action !== "all") {
    where.action = {
      startsWith: action,
      mode: "insensitive",
    };
  }
  if (search) {
    where.OR = [
      {
        user_name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }
  if (date === "today") {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.created_at = { gte: todayStart };
  } else if (date === "last7days") {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(todayStart.getDate() - 6);
    where.created_at = { gte: last7DaysStart };
  }

  const total = await prisma.activityLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { created_at: "desc" },
    skip,
    take: limit,
    select: {
      log_id: true,
      user_name: true,
      role: true,
      action: true,
      description: true,
      created_at: true,
    },
  });

  return NextResponse.json({
    data: logs,
    page: safePage,
    limit,
    total,
    totalPages,
  });
}
