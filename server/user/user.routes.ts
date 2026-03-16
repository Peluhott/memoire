import express from 'express'
import * as userController from './user.controller'
import { authenticateJWT } from '../auth/auth.middleware'
import { upload } from '../util/multer'


const router = express.Router();

router.post("/login", userController.loginUser);
router.post("/logout", authenticateJWT, userController.logoutUser);

router.post('/create', userController.createUser);
router.get('/me', authenticateJWT, userController.getCurrentUser);
router.delete('/me', authenticateJWT, userController.deleteCurrentUser);
router.patch('/profile', authenticateJWT, userController.updateProfile);
router.patch('/profile-picture', authenticateJWT, upload.single('file'), userController.uploadProfilePicture);
router.patch('/password', authenticateJWT, userController.updatePassword);
router.get('/search', authenticateJWT, userController.searchUsersByEmail);

export default router;
