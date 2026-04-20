import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      school_id: string | null;
    };
  }

  interface User {
    role: string;
    school_id: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    school_id?: string | null;
  }
}
