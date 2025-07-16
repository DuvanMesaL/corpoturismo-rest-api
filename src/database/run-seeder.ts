import { AppDataSource } from './data-source';
import { CompleteDataSeeder } from './seeders/complete-data.seeder';

async function runSeeder() {
  try {
    await AppDataSource.initialize();
    console.log('📦 Conexión a base de datos establecida');

    const seeder = new CompleteDataSeeder(AppDataSource);
    await seeder.run();

    await AppDataSource.destroy();
    console.log('✅ Seeder completado y conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error);
    process.exit(1);
  }
}

runSeeder();
