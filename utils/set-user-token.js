const jwt = require('jsonwebtoken');

module.exports = (res, user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
    phone : user.phone,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  res.cookie('myAssocToken', token, { httpOnly: true });
};
