import passport from 'passport'
import './auth/passport'
import express from 'express'
import dotenv from 'dotenv'
import userRouter from './user/user.routes'
import cors from 'cors';
import contentRouter from './content/content.routes'
import connectionRouter from './connection/connection.routes'
import deliveryRouter from './delivery/delivery.routes'


dotenv.config();

const app = express()

//fill out rest later
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(passport.initialize())

app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:5173'],
    credentials: true
}))
app.use('/user', userRouter );
app.use('/content', contentRouter)
app.use('/connections', connectionRouter)
app.use('/deliveries', deliveryRouter)



export default app;
