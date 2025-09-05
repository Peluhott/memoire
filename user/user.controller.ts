import {Request, Response} from 'express'
import * as userService from './user.service'
import { Prisma } from '@prisma/client'

export async function createUser(req: Request, res: Response) {
  try {
    const { email, username, password } = req.body
    await userService.createUserService(email, username, password)
    return res.status(201).json({ message: 'user created successfuly' })
  } catch (error: any) {
    // Unique violation from Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      
      return res.status(400).json({ message: 'username already exists' })
    }
    console.error('Error creating user:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function loginUser(req: Request, res: Response) {
    const { username, password } = req.body
    try {
        const token = await userService.loginUserService(username, password)
        return res.status(200).json({ token })
    } catch (error: any) {
        return res.status(401).json({ message: error.message })
    }
}