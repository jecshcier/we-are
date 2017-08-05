var crypto = require('crypto');
var encry = function md5(text) {
  return crypto.createHash('md5').update(text).digest('base64');
};
var hex = function hex(text) {
  return crypto.createHash('md5').update(text).digest('hex');
};
exports.encry = encry;
exports.hex = hex;