import { NextResponse } from "next/server";
import { hash } from "bcrypt";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        telefono: true,
        departamento: true,
        cargo: true,
        createdAt: true,
        sessions: {
          where: {
            expires: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Agregar campo isConnected basado en si tiene sesiones activas
    const usersWithConnectionStatus = users.map((user) => ({
      ...user,
      isConnected: user.sessions.length > 0,
      sessions: undefined, // Remover sessions del resultado
    }));

    return NextResponse.json({ users: usersWithConnectionStatus });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, name, password, role = "USER" } = body as {
      email?: string;
      name?: string;
      password?: string;
      role?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creando usuario", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
