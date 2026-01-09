const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Creando usuario administrador...');

    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}`);
      return;
    }

    // Hash de la contraseña (puedes cambiarla)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        email: 'dario.perez@redsalud.gob.cl',
        name: 'Administrador',
        hashedPassword: hashedPassword,
        role: 'ADMIN',
        activo: true,
        departamento: 'TIC',
        cargo: 'Administrador del Sistema',
      }
    });

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email: dario.perez@redsalud.gob.cl');
    console.log('🔑 Contraseña: CANal1');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después de iniciar sesión');

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
