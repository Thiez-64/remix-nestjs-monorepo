import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemixService {
  constructor(
    public readonly prisma: PrismaService,
    public readonly auth: AuthService,
  ) {}

  public readonly getUser = async ({ userId }: { userId: string }) => {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  };

  async getActions() {
    const actions = await this.prisma.action.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return actions.map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      date: new Date(action.date),
      userId: action.userId,
      userName: action.user.name,
    }));
  }

  async createAction(data: {
    title: string;
    description: string;
    date: Date;
    userId: string;
  }) {
    return await this.prisma.action.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
