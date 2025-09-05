import express from 'express'
import * as userController from './user.controller'


const router = express.Router();

router.post("/login", userController.loginUser);



router.post('/create', userController.createUser);





export default router;