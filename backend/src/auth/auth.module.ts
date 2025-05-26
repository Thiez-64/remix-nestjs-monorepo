import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { CookieSerializer } from './cookie-serialized';
import { LocalAuthGuard } from './local-auth.guard';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'local',
      property: 'user',
      session: true,
    }),
    EmailModule,
  ],
  controllers: [],
  providers: [
    LocalStrategy,
    LocalAuthGuard,
    CookieSerializer,
    PrismaService,
    AuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
