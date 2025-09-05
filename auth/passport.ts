import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt'
import * as userQueries from '../user/user.repository'
import dotenv from 'dotenv'

dotenv.config()

// Strategy configuration 

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
};

passport.use(
    new JwtStrategy(options, async (jwt_payload,done) => {
        try {
            const user = await userQueries.getUserById(jwt_payload.id);
            if(user){
                return done(null,user);
                
            } else {
                return done(null, false)
            }
        } catch (error) {
            return done(error,false)
        }
    })
);