const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');

    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log('✅ Conexión exitosa!');
    console.log(`📊 Usuarios en la base de datos: ${userCount}`);

    if (userCount > 0) {
      // Mostrar el primer usuario
      const firstUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      });
      console.log('👤 Primer usuario:', firstUser);
    }

    // Contar licitaciones
    const licitacionCount = await prisma.licitacion.count();
    console.log(`📋 Licitaciones en la base de datos: ${licitacionCount}`);

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Detalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
