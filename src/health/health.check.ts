import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function healthCheck() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource = app.get('DataSource');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await dataSource.query('SELECT 1');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

void healthCheck();
