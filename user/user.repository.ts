import prisma from "../prisma/prisma";

import { HealthType } from '@prisma/client';

export async function insertUser(username: string, password: string, email: string) {
    return await prisma.$transaction(async (tx) => { //incase one fails it all fails
        const user = await tx.user.create({
            data: {
                username,
                password,
                email
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

export async function getUserByUsername(username:string) {
    return await prisma.user.findUnique({
        where:{username:username}
    })
}