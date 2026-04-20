import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentClassesPage() {
  const session = await auth();
  if (!session || session.user.role !== "student" || !session.user.school_id) {
    redirect("/login");
  }

  const classes = await prisma.class.findMany({
    where: {
      school_id: session.user.school_id,
      students: {
        some: {
          user_id: session.user.id,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      class_id: true,
      name: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Classes</h3>
      {classes.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-md">
          <p className="text-sm text-gray-400">No data available</p>
        </div>
      ) : (
        classes.map((classItem) => (
          <Link
            key={classItem.class_id}
            href={`/student/classes/${classItem.class_id}`}
            className="block rounded-xl bg-white p-5 shadow-md transition hover:shadow-lg"
          >
            <p className="text-lg font-semibold text-blue-700">{classItem.name}</p>
            <p className="mt-1 text-sm text-gray-600">
              Total Students: {classItem._count.students}
            </p>
          </Link>
        ))
      )}
    </section>
  );
}
