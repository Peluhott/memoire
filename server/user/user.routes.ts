import express from 'express'
import * as userController from './user.controller'
import { authenticateJWT } from '../auth/auth.middleware'


const router = express.Router();

router.post("/login", userController.loginUser);
router.post("/logout", authenticateJWT, userController.logoutUser);

router.post('/create', userController.createUser);

export default router;
