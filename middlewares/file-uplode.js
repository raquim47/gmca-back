const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const os = require('os');

const serviceAccount = require(path.resolve(
  __dirname,
  '../config/firebase-service-account-file.json'
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://edu-assoc.appspot.com',
});

const bucket = admin.storage().bucket();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const newFilename = `${Date.now()}-${file.originalname}`;
    cb(null, newFilename);
  },
});

const upload = multer({ storage: storage });

module.exports = { upload, bucket };
