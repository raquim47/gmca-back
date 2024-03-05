const passport = require('passport');

module.exports = (req, res, next) => {
  if (!req.cookies.myAssocToken) {
    next();
    return;
  }

  passport.authenticate('jwt', { session: false })(req, res, next);
};
