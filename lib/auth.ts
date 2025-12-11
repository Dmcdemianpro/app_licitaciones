import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "@/auth.config";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import type { Adapter } from "next-auth/adapters";

// NextAuth v5: Importar configuración desde auth.config.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  secret: env.NEXTAUTH_SECRET,
  ...authConfig
});

// Exportar handlers para uso en API routes
export const { GET, POST } = handlers;
