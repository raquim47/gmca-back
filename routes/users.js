const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requestHandler = require('../utils/request-handler');
const bcrypt = require('bcrypt');
const setUserToken = require('../utils/set-user-token');
const { ERROR } = require('../utils/constants');
const throwError = require('../utils/throw-error');

// 사용자 가져오기
router.get(
  '/me',
  requestHandler(async (req) => {
    if (req.user) {
      const user = await User.findById(req.user.userId);
      if (!user) throwError(ERROR.USER_NOT_FOUND, 404);
      return { user };
    }
    return { user: null };
  })
);

// 이메일 중복 확인
router.get(
  '/check-email',
  requestHandler(async (req) => {
    const { email } = req.query;
    const user = await User.findOne({ email });

    return user ? { isAvailable: false } : { isAvailable: true };
  })
);

// 회원가입
router.post(
  '/signup',
  requestHandler(async (req) => {
    const { email, password, username, phone } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) throw throwError(ERROR.EMAIL_DUPLICATE, 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
      username,
      phone,
    });
  })
);

// 로그인
router.post(
  '/login',
  requestHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const isValidPassword = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !isValidPassword)
      throw throwError(ERROR.CREDENTIALS_INVALID, 401);

    setUserToken(res, user);
  })
);

// 로그아웃
router.post(
  '/logout',
  requestHandler((req, res) => {
    res.cookie('myAssocToken', '', { expires: new Date(0), httpOnly: true });
  })
);

// 사용자 업데이트
router.patch(
  '/me',
  requestHandler(async (req) => {
    const userId = req.user.userId;
    const { password, phone, username } = req.body;

    const user = await User.findById(userId);
    if (!user) throwError(ERROR.USER_NOT_FOUND, 404);

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throwError(ERROR.CREDENTIALS_INVALID, 401);

    const updateData = {};
    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;
    await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
  })
);

module.exports = router;
