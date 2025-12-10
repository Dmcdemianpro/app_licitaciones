// prisma/seed.ts
import { config } from 'dotenv';
// Cargar variables de entorno desde .env
config();

import { hash } from "bcrypt";
import { prisma } from "../lib/prisma";

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // Limpiar datos existentes (opcional - comentar si no se desea limpiar)
  // await prisma.ticket.deleteMany();
  // await prisma.user.deleteMany();

  // Crear usuarios con diferentes roles
  const defaultPassword = await hash("admin123", 10);

  console.log('👥 Creando usuarios...');

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador Sistema",
      role: "ADMIN",
      hashedPassword: defaultPassword,
      activo: true,
      telefono: "+56912345678",
      departamento: "TI",
      cargo: "Administrador de Sistemas",
    },
  });
  console.log('  ✓ Admin creado');

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "María González",
      role: "MANAGER",
      hashedPassword: defaultPassword,
      activo: true,
      telefono: "+56912345679",
      departamento: "Licitaciones",
      cargo: "Gerente de Licitaciones",
    },
  });
  console.log('  ✓ Manager creado');

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@example.com" },
    update: {},
    create: {
      email: "supervisor@example.com",
      name: "Carlos Martínez",
      role: "SUPERVISOR",
      hashedPassword: defaultPassword,
      activo: true,
      telefono: "+56912345680",
      departamento: "Operaciones",
      cargo: "Supervisor de Operaciones",
    },
  });
  console.log('  ✓ Supervisor creado');

  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      email: "user1@example.com",
      name: "Ana Pérez",
      role: "USER",
      hashedPassword: defaultPassword,
      activo: true,
      telefono: "+56912345681",
      departamento: "Licitaciones",
      cargo: "Analista",
    },
  });
  console.log('  ✓ Usuario 1 creado');

  const user2 = await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      email: "user2@example.com",
      name: "Pedro Rojas",
      role: "USER",
      hashedPassword: defaultPassword,
      activo: true,
      telefono: "+56912345682",
      departamento: "Soporte",
      cargo: "Especialista de Soporte",
    },
  });
  console.log('  ✓ Usuario 2 creado');

  // Crear tickets de ejemplo
  console.log('\n🎫 Creando tickets de ejemplo...');

  await prisma.ticket.create({
    data: {
      title: "Error en sistema de autenticación",
      description: "Los usuarios reportan problemas al iniciar sesión. El sistema muestra mensaje de error genérico.",
      type: "Bug",
      priority: "ALTA",
      status: "ABIERTO",
      assignee: "Carlos Martínez",
      ownerId: user1.id,
    },
  });

  await prisma.ticket.create({
    data: {
      title: "Solicitud de nuevo reporte",
      description: "Se necesita un reporte mensual de licitaciones adjudicadas con filtros por fecha y monto.",
      type: "Feature Request",
      priority: "MEDIA",
      status: "EN_PROGRESO",
      assignee: "Pedro Rojas",
      ownerId: manager.id,
    },
  });

  await prisma.ticket.create({
    data: {
      title: "Actualizar documentación de API",
      description: "La documentación de los endpoints de la API necesita ser actualizada con los nuevos cambios.",
      type: "Documentation",
      priority: "BAJA",
      status: "ABIERTO",
      assignee: null,
      ownerId: supervisor.id,
    },
  });

  console.log('  ✓ 3 tickets creados');

  // Crear licitaciones de ejemplo
  console.log('\n📋 Creando licitaciones de ejemplo...');

  const licitacion1 = await prisma.licitacion.create({
    data: {
      codigoExterno: "LIC-2024-001",
      nombre: "Suministro de equipos médicos",
      descripcion: "Licitación pública para adquisición de equipos médicos para hospital regional.",
      entidad: "Ministerio de Salud",
      tipo: "PUBLICA",
      estado: "ACTIVA",
      montoEstimado: 50000000,
      moneda: "CLP",
      fechaPublicacion: new Date('2024-01-15'),
      fechaCierre: new Date('2024-12-30'),
      urlExterna: "https://www.mercadopublico.cl/licitacion1",
      responsableId: manager.id,
      createdById: manager.id,
    },
  });

  const licitacion2 = await prisma.licitacion.create({
    data: {
      codigoExterno: "LIC-2024-002",
      nombre: "Servicios de consultoría en TI",
      descripcion: "Contratación de servicios de consultoría para implementación de sistema ERP.",
      entidad: "Empresa Privada S.A.",
      tipo: "PRIVADA",
      estado: "EN_PREPARACION",
      montoEstimado: 30000000,
      moneda: "CLP",
      fechaPublicacion: new Date('2024-02-01'),
      fechaCierre: new Date('2024-12-15'),
      responsableId: supervisor.id,
      createdById: manager.id,
    },
  });

  console.log('  ✓ 2 licitaciones creadas');

  // Crear notas para licitaciones
  console.log('\n📝 Creando notas...');

  await prisma.nota.create({
    data: {
      contenido: "Reunión inicial realizada con éxito. El cliente confirmó los requisitos principales.",
      licitacionId: licitacion1.id,
      autorId: manager.id,
    },
  });

  await prisma.nota.create({
    data: {
      contenido: "Se requiere validación técnica del equipo antes de presentar propuesta.",
      licitacionId: licitacion2.id,
      autorId: supervisor.id,
    },
  });

  console.log('  ✓ 2 notas creadas');

  // Crear citas de ejemplo
  console.log('\n📅 Creando citas de ejemplo...');

  const cita1 = await prisma.cita.create({
    data: {
      titulo: "Reunión de presentación - Licitación equipos médicos",
      descripcion: "Presentación inicial de propuesta al cliente",
      tipo: "PRESENTACION",
      estado: "PROGRAMADA",
      fechaInicio: new Date('2024-12-15T10:00:00'),
      fechaFin: new Date('2024-12-15T12:00:00'),
      ubicacion: "Oficinas Ministerio de Salud",
      organizadorId: manager.id,
    },
  });

  await prisma.citaParticipante.create({
    data: {
      citaId: cita1.id,
      userId: supervisor.id,
      asistio: false,
    },
  });

  console.log('  ✓ 1 cita creada con participante');

  // Crear notificaciones de ejemplo
  console.log('\n🔔 Creando notificaciones...');

  await prisma.notificacion.create({
    data: {
      tipo: "INFO",
      titulo: "Nueva licitación asignada",
      mensaje: "Se te ha asignado la licitación: Suministro de equipos médicos",
      leida: false,
      userId: manager.id,
      referenceType: "LICITACION",
      referenceId: licitacion1.id,
    },
  });

  await prisma.notificacion.create({
    data: {
      tipo: "ADVERTENCIA",
      titulo: "Licitación próxima a vencer",
      mensaje: "La licitación LIC-2024-001 vence en 15 días",
      leida: false,
      userId: manager.id,
      referenceType: "LICITACION",
      referenceId: licitacion1.id,
    },
  });

  console.log('  ✓ 2 notificaciones creadas');

  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('📧 Credenciales de acceso (contraseña para todos: admin123):');
  console.log('  - Admin:      admin@example.com');
  console.log('  - Manager:    manager@example.com');
  console.log('  - Supervisor: supervisor@example.com');
  console.log('  - Usuario 1:  user1@example.com');
  console.log('  - Usuario 2:  user2@example.com\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
