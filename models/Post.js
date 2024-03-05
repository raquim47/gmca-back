const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    authorName: { type: String, required: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, required: true },
    files: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],

    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
