'use strict';

const crypto = require('crypto');
const format = require('biguint-format');

function random (qty) {
    return crypto.randomBytes(qty);
}

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Random value is ${format(random(8), 'dec')}`,
      input: event,
    }),
  };

  callback(null, response);
};
