import prisma from "../prisma/prisma";

export async function insertUser(username: string, password: string, email: string) {
    return await prisma.user.create({
        data: {
            username: username,
            password: password,
            email: email
        }
    })
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