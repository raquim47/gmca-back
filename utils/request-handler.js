const { ERROR } = require('../utils/constants');
const buildResponse = require('./build-response');

module.exports = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req, res, next);
    res.json(buildResponse(result));
  } catch (err) {
    console.error(err.message || ERROR.INTERNAL_ERROR);
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json(
        buildResponse(null, { message: err.message || ERROR.INTERNAL_ERROR })
      );
  }
};
