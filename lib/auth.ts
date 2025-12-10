import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";
import { env } from "@/lib/env";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Verificar que las credenciales existan
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        
        try {
          const user = await prisma.user.findUnique({ 
            where: { email: credentials.email } 
          });
          
          if (!user || !user.hashedPassword) {
            return null;
          }
          
          const valid = await compare(credentials.password, user.hashedPassword);
          if (!valid) {
            return null;
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  secret: env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
};

// Crear la instancia de NextAuth (v5) y exponer helpers
const authHandler = NextAuth(authOptions);

export const auth = authHandler.auth;
export const { GET, POST } = authHandler.handlers;
export default authHandler;
