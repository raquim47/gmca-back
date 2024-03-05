const passport = require('passport');

module.exports = (req, res, next) => {
  console.log('cookies', req.cookies);
  console.log('myAssocToken', req.cookies.myAssocToken);
  if (!req.cookies.myAssocToken) {
    next();
    return;
  }

  passport.authenticate('jwt', { session: false })(req, res, next);
};
