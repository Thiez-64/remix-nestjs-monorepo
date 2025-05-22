import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getPublicDir, startDevServer } from '@thiez-64/frontend';
import { urlencoded } from 'body-parser';
import { RedisStore } from 'connect-redis';

import session from 'express-session';
import Redis from 'ioredis';
import passport from 'passport';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './auth/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  await startDevServer(app);

  // Initialize client.
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisClient = new Redis(redisUrl, {})
    .on('error', console.error)
    .on('connect', () => {
      console.log('Connected to Redis');
    });

  // Initialize store.
  const redisStore = new RedisStore({
    client: redisClient,
    ttl: 86400 * 30,
  });

  app.set('trust proxy', 1);

  app.use(
    session({
      store: redisStore,
      resave: false,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET || 'keyboard cat',
      cookie: {
        maxAge: 86400 * 30,
        sameSite: 'lax',
        secure: false,
      },
    }),
  );

  app.useStaticAssets(getPublicDir(), {
    immutable: true,
    maxAge: '1y',
    index: false,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  app.use('/auth/login', urlencoded({ extended: true }));
  app.use('/auth/logout', urlencoded({ extended: true }));
  const selectedPort = process.env.PORT || 3000;

  console.log(`Server is running on port http://localhost:${selectedPort}`);
  await app.listen(selectedPort);
}
bootstrap();
