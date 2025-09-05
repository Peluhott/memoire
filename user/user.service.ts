import bcrypt from 'bcrypt'
import * as userQueries from './user.repository'
import jwt from 'jsonwebtoken'


export async function createUserService(email: string, username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10)
    return await userQueries.insertUser(username, hashedPassword, email)
}

export async function loginUserService(username: string, password: string) {
    const user = await userQueries.getUserByUsername(username)
    if (!user) {
        throw new Error('user not found')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('wrong password')
    }
    const payload = {
        id: user.id,
        username: user.username,
        
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '1d',
    })
    return token
}