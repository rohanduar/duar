import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schoolEmailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.co\.id$/;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            school: true,
          },
        });

        if (!user) {
          return null;
        }

        const isTeacherOrStudent =
          user.role === "teacher" || user.role === "student";
        if (isTeacherOrStudent && !schoolEmailPattern.test(email)) {
          return null;
        }

        if (!user.is_active) {
          return null;
        }

        if (user.role !== "super_admin") {
          if (!user.school || !user.school.is_active) {
            return null;
          }
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          school_id: user.school_id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.school_id = user.school_id ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role ?? "";
      session.user.school_id =
        typeof token.school_id === "string" ? token.school_id : null;

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const role = (user as { role?: string }).role ?? "unknown";
        await prisma.activityLog.create({
          data: {
            user_name: user.name ?? "Unknown User",
            role,
            action: "login",
            description: `${role} logged in`,
          },
        });
      } catch (error) {
        console.error("Failed to write login activity log:", error);
      }
    },
  },
});
