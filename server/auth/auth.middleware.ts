import passport from 'passport'

//uses strategy we defined in passport
export const authenticateJWT = passport.authenticate('jwt',{session:false})