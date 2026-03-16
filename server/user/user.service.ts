import bcrypt from 'bcrypt'
import * as userQueries from './user.repository'
import jwt from 'jsonwebtoken'
import { uploadProfileImage } from '../util/uploadImage'
import { deleteProductImage } from '../util/deleteImage'


export async function createUserService(email: string, username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10)
    return await userQueries.insertUser(username, hashedPassword, email)
}

export async function getCurrentUserService(userId: number) {
    const user = await userQueries.getSafeUserById(userId)
    if (!user) {
        throw new Error('user not found')
    }
    return user
}

export async function deleteCurrentUserService(userId: number) {
    const user = await userQueries.getUserById(userId)
    if (!user) {
        throw new Error('user not found')
    }

    const contentAssets = await userQueries.listUserContentAssets(userId)
    for (const asset of contentAssets) {
        await deleteProductImage(asset.public_id, asset.resource_type)
    }

    await userQueries.deleteUserAccount(userId)
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
        tokenVersion: user.tokenVersion,
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '1d',
    })
    return token
}

export async function logoutUserService(userId: number) {
    return await userQueries.incrementUserTokenVersion(userId)
}

export async function updateUserProfileService(
    userId: number,
    name?: string,
    profilePictureUrl?: string | null,
) {
    const updates: { name?: string; profilePictureUrl?: string | null } = {}

    if (typeof name === 'string') {
        const trimmedName = name.trim()
        if (!trimmedName) {
            throw new Error('name is required')
        }
        updates.name = trimmedName
    }

    if (profilePictureUrl !== undefined) {
        const trimmedUrl = profilePictureUrl?.trim() ?? ''
        updates.profilePictureUrl = trimmedUrl ? trimmedUrl : null
    }

    if (Object.keys(updates).length === 0) {
        throw new Error('no profile updates provided')
    }

    return await userQueries.updateUserProfile(userId, updates)
}

export async function updatePasswordService(
    userId: number,
    currentPassword: string,
    newPassword: string,
) {
    const user = await userQueries.getUserById(userId)
    if (!user) {
        throw new Error('user not found')
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
        throw new Error('current password is incorrect')
    }

    const trimmedPassword = newPassword.trim()
    if (trimmedPassword.length < 8) {
        throw new Error('new password must be at least 8 characters')
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10)
    await userQueries.updateUserPassword(userId, hashedPassword)
    await userQueries.incrementUserTokenVersion(userId)
}

export async function searchUsersByEmailService(email: string, currentUserId: number) {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
        throw new Error('email query is required')
    }

    return await userQueries.searchUsersByEmail(trimmedEmail, currentUserId)
}

export async function uploadProfilePictureService(userId: number, file?: Express.Multer.File) {
    if (!file) {
        throw new Error('profile image is required')
    }

    const uploaded = await uploadProfileImage(file)
    return await userQueries.updateUserProfile(userId, {
        profilePictureUrl: uploaded.secure_url,
    })
}
