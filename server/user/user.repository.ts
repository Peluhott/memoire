import prisma from "../prisma/prisma";

import { HealthType } from '@prisma/client';

export async function insertUser(username: string, password: string, email: string) {
    return await prisma.$transaction(async (tx) => { //incase one fails it all fails
        const user = await tx.user.create({
            data: {
                username,
                name: username,
                password,
                email,
                // initial limits
                limit_upload: 5,
                limit_connections: 25,
            }
        });
        // Create a HealthData row for each HealthType
        const healthTypes = Object.values(HealthType);
        await Promise.all(
            healthTypes.map(type =>
                tx.healthData.create({ //if one fails they all fails
                    data: {
                        userId: user.id,
                        type,
                        value: null,
                        createdAt: null
                    }
                })
            )
        );
        return user;
    });
}

export async function getUserById(id: number) {
    return await prisma.user.findUnique({
        where: {id}
    })
}

export async function getSafeUserById(id: number) {
    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            profilePictureUrl: true,
            limit_upload: true,
            limit_connections: true,
        },
    })
}

export async function getUserByUsername(username:string) {
    return await prisma.user.findUnique({
        where:{username:username}
    })
}

export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email },
    })
}

export async function searchUsersByEmail(email: string, excludeUserId?: number) {
    return await prisma.user.findMany({
        where: {
            email: {
                contains: email,
                mode: 'insensitive',
            },
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            profilePictureUrl: true,
        },
        take: 10,
        orderBy: {
            id: 'asc',
        },
    })
}

export async function updateUserProfile(
    id: number,
    data: {
        name?: string;
        profilePictureUrl?: string | null;
    }
) {
    return await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            profilePictureUrl: true,
            limit_upload: true,
            limit_connections: true,
        },
    })
}

export async function updateUserPassword(id: number, password: string) {
    return await prisma.user.update({
        where: { id },
        data: { password },
    })
}

export async function incrementUserTokenVersion(id: number) {
    return await prisma.user.update({
        where: { id },
        data: {
            tokenVersion: {
                increment: 1,
            },
        },
    })
}
