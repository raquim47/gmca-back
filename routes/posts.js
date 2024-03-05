const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const fs = require('fs');
const { isValidObjectId } = require('mongoose');
const { upload, bucket } = require('../middlewares/file-uplode');
const requestHandler = require('../utils/request-handler');
const { ERROR } = require('../utils/constants');
const throwError = require('../utils/throw-error');

// 새 post 등록
router.post(
  '/',
  upload.array('files', 2),
  requestHandler(async (req) => {
    const { title, content, category } = req.body;
    const { username: authorName, userId: authorId } = req.user;
    let fileData = null;

    if (req.files) {
      fileData = await Promise.all(
        req.files.map(async (file) => {
          const blob = bucket.file(file.originalname);
          const blobStream = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });

          return new Promise((resolve, reject) => {
            const fileStream = fs.createReadStream(file.path);
            fileStream.on('error', (error) =>
              reject(new Error('Error reading file from disk'))
            );
            fileStream
              .pipe(blobStream)
              .on('error', (error) =>
                reject(new Error('Error uploading file to storage'))
              )
              .on('finish', async () => {
                const signedUrlConfig = {
                  action: 'read',
                  expires: '03-09-2491',
                };
                const [url] = await blob.getSignedUrl(signedUrlConfig);
                resolve({ url, name: file.originalname });
              });
          });
        })
      );
    }

    await Post.create({
      title,
      authorName,
      authorId,
      content,
      category,
      files: fileData,
    });
  })
);

// posts 가져오기
router.get(
  '/',
  requestHandler(async (req) => {
    const { category, page = 1, limit = 5, searchType, keyword } = req.query;

    let filter = { category: category };
    if (keyword) {
      if (searchType === 'title' || !searchType) {
        filter.title = new RegExp(keyword, 'i');
      } else if (searchType === 'author') {
        filter.authorName = new RegExp(keyword, 'i');
      }
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const totalPosts = await Post.countDocuments(filter);

    return { posts, totalPosts, totalPages: Math.ceil(totalPosts / limit) };
  })
);

// post 가져오기
router.get(
  '/:postId',
  requestHandler(async (req) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      throwError(`${postId} : ${ERROR.INVALID_VALUE}`, 400);
    }

    const post = await Post.findById(postId);
    if (!post) throwError(ERROR.POST_NOT_FOUND, 404);

    return { post };
  })
);

// post 업데이트
router.patch(
  '/:postId',
  upload.array('files', 2),
  requestHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    const post = await Post.findById(postId);
    if (!post) throwError(ERROR.POST_NOT_FOUND, 404);

    // 기존 파일 삭제
    if (post.files && post.files.length > 0) {
      await Promise.all(
        post.files.map(async (file) => {
          const blob = bucket.file(file.name);
          await blob.delete().catch((error) => {
            console.error(`Failed to delete file ${file.name}: ${error}`);
          });
        })
      );
    }

    let fileData = [];

    // 새 파일 업로드
    if (req.files) {
      fileData = await Promise.all(
        req.files.map(async (file) => {
          const blob = bucket.file(file.originalname);
          const blobStream = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });

          return new Promise((resolve, reject) => {
            const fileStream = fs.createReadStream(file.path);
            fileStream.on('error', (error) =>
              reject(new Error('Error reading file from disk'))
            );
            fileStream
              .pipe(blobStream)
              .on('error', (error) =>
                reject(new Error('Error uploading file to storage'))
              )
              .on('finish', async () => {
                const signedUrlConfig = {
                  action: 'read',
                  expires: '03-09-2491',
                };
                const [url] = await blob.getSignedUrl(signedUrlConfig);
                resolve({ url, name: file.originalname });
              });
          });
        })
      );
    }

    await Post.findByIdAndUpdate(
      postId,
      {
        title,
        content,
        files: fileData,
      },
      { new: true }
    );
  })
);

// post 삭제
router.delete(
  '/:postId',
  requestHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) throwError(ERROR.POST_NOT_FOUND, 404);

    // Firebase Storage에서 파일 삭제
    if (post.files && post.files.length > 0) {
      await Promise.all(
        post.files.map(async (file) => {
          const blob = bucket.file(file.name);
          try {
            await blob.delete();
          } catch (error) {
            console.error(`Failed to delete file ${file.name}: ${error}`);
          }
        })
      );
    }

    await Post.findByIdAndDelete(postId);
  })
);

// post 조회수 증가
router.patch(
  '/:postId/views',
  requestHandler(async (req) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      throwError(`${postId} : ${ERROR.INVALID_VALUE}`, 400);
    }
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
  })
);

module.exports = router;
