const passport = require('passport');
const { Strategy: JwtStrategy } = require('passport-jwt');
require('dotenv').config();

const cookieExtractor = (req) => {
  return req.cookies.myAssocToken;
};

const opts = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: cookieExtractor,
};

const jwtStrategy = new JwtStrategy(opts, (user, done) => {
  done(null, user);
});

module.exports = () => {
  passport.use(jwtStrategy);
};
