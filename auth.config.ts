import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";

// Configuración de NextAuth v5
// Nota: No usar "satisfies NextAuthConfig" porque el tipo no está disponible en beta.28
export default {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Verificar que las credenciales existan y sean strings
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // Type assertions para TypeScript
        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.hashedPassword) {
            return null;
          }

          const valid = await compare(password, user.hashedPassword);
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
  callbacks: {
    async jwt({ token, user }: any) {
      // Obtener la versión actual de la aplicación
      const currentAppVersion = process.env.APP_VERSION || "1.0.0";

      if (user) {
        // Nuevo login: agregar información del usuario y versión
        token.id = user.id;
        token.role = user.role;
        token.appVersion = currentAppVersion;
      } else {
        // Sesión existente: validar versión
        // Si la versión no coincide, invalidar el token
        if (token.appVersion !== currentAppVersion) {
          console.log(`Session invalidated: version mismatch (token: ${token.appVersion}, current: ${currentAppVersion})`);
          // Retornar un token vacío para forzar re-autenticación
          return {};
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      // Si el token está vacío (invalidado), retornar sesión nula
      if (!token.id) {
        return null as any;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
};
