import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      color: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    color?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    color?: string;
  }
}
