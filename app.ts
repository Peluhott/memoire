import passport from 'passport'
import './auth/passport'
import express from 'express'
import dotenv from 'dotenv'
import userRouter from './user/user.routes'
import cors from 'cors';


dotenv.config();

const app = express()

//fill out rest later
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(passport.initialize())

app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true
}))
app.use('/user', userRouter );



export default app;