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

export async function logoutUser(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        await userService.logoutUserService(req.user.id)
        return res.status(200).json({ message: 'logout successful' })
    } catch (error) {
        console.error('Error logging out user:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

export async function getCurrentUser(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        const user = await userService.getCurrentUserService(req.user.id)
        return res.status(200).json(user)
    } catch (error: any) {
        const status = error.message === 'user not found' ? 404 : 500
        return res.status(status).json({ message: error.message })
    }
}

export async function deleteCurrentUser(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        await userService.deleteCurrentUserService(req.user.id)
        return res.status(200).json({ message: 'account deleted' })
    } catch (error: any) {
        const status = error.message === 'user not found' ? 404 : 500
        return res.status(status).json({ message: error.message })
    }
}

export async function updateProfile(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        const { name, profilePictureUrl } = req.body
        const user = await userService.updateUserProfileService(req.user.id, name, profilePictureUrl)
        return res.status(200).json(user)
    } catch (error: any) {
        const status = [
            'name is required',
            'no profile updates provided',
        ].includes(error.message)
            ? 400
            : 500
        return res.status(status).json({ message: error.message })
    }
}

export async function updatePassword(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        const { currentPassword, newPassword } = req.body
        await userService.updatePasswordService(req.user.id, currentPassword, newPassword)
        return res.status(200).json({ message: 'password updated, please log in again' })
    } catch (error: any) {
        const status = [
            'current password is incorrect',
            'new password must be at least 8 characters',
            'user not found',
        ].includes(error.message)
            ? 400
            : 500
        return res.status(status).json({ message: error.message })
    }
}

export async function searchUsersByEmail(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        const email = typeof req.query.email === 'string' ? req.query.email : ''
        const users = await userService.searchUsersByEmailService(email, req.user.id)
        return res.status(200).json(users)
    } catch (error: any) {
        const status = error.message === 'email query is required' ? 400 : 500
        return res.status(status).json({ message: error.message })
    }
}

export async function uploadProfilePicture(req: Request, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'authentication required' })
    }

    try {
        const user = await userService.uploadProfilePictureService(req.user.id, req.file as Express.Multer.File | undefined)
        return res.status(200).json(user)
    } catch (error: any) {
        const status = error.message === 'profile image is required' ? 400 : 500
        return res.status(status).json({ message: error.message })
    }
}
