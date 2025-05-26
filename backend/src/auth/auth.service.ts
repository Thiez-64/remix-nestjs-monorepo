import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { compare, hash } from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
const PASSWORD_SALT = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  public readonly checkIfUserExists = async ({
    email,
    password,
    withPassword,
  }: {
    email: string;
    withPassword: boolean;
    password: string;
  }) => {
    // Renvoie true si l'utilisateur n'existe pas
    // Renvoie false si l'utilisateur existe
    // 1. Vérifier que l'utilisateur existe sur l'email
    // 2. Si withPassword est activé, on vérifie que son mot de passe
    // est bien défini.
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });
    if (!existingUser) {
      return {
        message: "L'email est invalide",
        error: true,
      };
    }

    if (withPassword) {
      // Rajouter une logique de validation par mot de passez
      const isPasswordValid = await compare(password, existingUser.password);
      if (!isPasswordValid) {
        return {
          message: 'Le mot de passe est invalide',
          error: true,
        };
      }
    }
    return {
      message: "L'utilisateur existe.",
      error: false,
    };
  };

  public readonly createUser = async ({
    email,
    name,
    password,
  }: {
    email: string;
    name: string;
    password: string;
  }) => {
    const hashedPassword = await hash(password, PASSWORD_SALT);
    return await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  };

  public readonly authenticateUser = async ({ email }: { email: string }) => {
    return await this.prisma.session.create({
      data: {
        user: {
          connect: {
            email,
          },
        },
        sessionToken: createId(),
      },
      select: {
        sessionToken: true,
      },
    });
  };

  public readonly generatePasswordResetToken = async ({
    email,
  }: {
    email: string;
  }) => {
    // Générer un token unique et sécurisé
    const resetToken = createId();

    // Stocker le token dans la base de données avec une expiration
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        user: {
          connect: {
            email,
          },
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
      },
    });

    // Envoyer l'email
    await this.emailService.sendPasswordResetEmail({
      email,
      resetToken,
    });

    return resetToken;
  };

  public readonly validatePasswordResetToken = async ({
    token,
  }: {
    token: string;
  }) => {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { error: true, message: 'Token invalide' };
    }

    if (resetToken.used) {
      return { error: true, message: 'Ce token a déjà été utilisé' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { error: true, message: 'Le token a expiré' };
    }

    return { error: false, user: resetToken.user };
  };

  public readonly resetPassword = async ({
    token,
    newPassword,
  }: {
    token: string;
    newPassword: string;
  }) => {
    const validation = await this.validatePasswordResetToken({ token });
    if (validation.error || !validation.user) {
      return validation;
    }

    const hashedPassword = await hash(newPassword, PASSWORD_SALT);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: validation.user.id },
      data: { password: hashedPassword },
    });

    // Marquer le token comme utilisé
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    return { error: false };
  };

  public readonly changePassword = async ({
    userId,
    currentPassword,
    newPassword,
  }: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) => {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return { error: true, message: 'User not found' };
    }

    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return { error: true, message: 'Current password is incorrect' };
    }

    const hashedPassword = await hash(newPassword, PASSWORD_SALT);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { error: false };
  };
}
