// @ts-ignore - NextAuth v5 beta tiene problemas con tipos de TypeScript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "@/auth.config";
import prisma from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

// NextAuth v5: Importar configuración desde auth.config.ts
// @ts-ignore - Problema conocido con moduleResolution y next-auth beta.28
const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  ...authConfig
});

// Exportar funciones y handlers
export const { handlers, auth, signIn, signOut } = nextAuth;
export const { GET, POST } = handlers;
