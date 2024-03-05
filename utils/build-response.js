module.exports = (data, errorMessage = null) => {
  if (errorMessage) {
    return { error: errorMessage };
  }
  return data;
};