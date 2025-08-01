import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './types';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUsers(excludeUserId: number) {
    console.log('excludeUserId:', excludeUserId);
    const allUsers = await this.prisma.user.findMany();
    console.log('Todos os usuários:', allUsers);
     
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        email: true,
        bio: true,
        birthDate: true,
        location: true,
        website: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log('Usuários filtrados:', users);
  
    return users;
  }
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        email: true,
        bio: true,
        birthDate: true,
        location: true,
        website: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: number, dto: UserDto) {
    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id, isActive: true },
        data: {
          name: dto.name,
          email: dto.email,
          bio: dto.bio,
          birthDate: dto.birthDate,
          avatarUrl: dto.avatarUrl,
          username: dto.username,
          website: dto.website,
          location: dto.location
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          email: true,
          bio: true,
          birthDate: true,
          location: true,
          website: true,
          role: true
        }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async deactivateUser(id: number) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}