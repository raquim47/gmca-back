require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const getUserFromJWT = require('./middlewares/get-user-from-jwt');
const cors = require('cors');
const initPassport = require('./passport');
const passport = require('passport');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');

const corsOptions = {
  origin: 'http://localhost:3000', 
  credentials: true, 
};

initPassport();

const server = express();
server.use(cors(corsOptions));
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cookieParser());

server.use(passport.initialize());
server.use(getUserFromJWT);
server.use('/api/users', usersRoutes);
server.use('/api/posts', postsRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB 연결'))
  .catch((err) => console.error('Mongoose error:', err));

server.listen(3030, () => {
  console.log(`서버 실행, 포트 : ${process.env.PORT}`);
});
