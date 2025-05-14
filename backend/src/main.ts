import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getPublicDir, startDevServer } from '@thiez-64/frontend';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  await startDevServer(app);
  app.useStaticAssets(getPublicDir(), {
    immutable: true,
    maxAge: '1y',
    index: false,
  });
  const selectedPort = process.env.PORT || 3000;

  console.log(`Server is running on port http://localhost:${selectedPort}`);
  await app.listen(selectedPort);
}
bootstrap();
