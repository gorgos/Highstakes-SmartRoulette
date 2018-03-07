const https = require('https');
const querystring = require('querystring');

const BUCKET = 'my-secure-bucket-for-temporary-storage';
let AWS, s3;

if (BUCKET) {
  AWS = require('aws-sdk');
  s3 = new AWS.S3({ sslEnabled: true });
}

function route(event, context, keyword_handler_map) {
  for (var keyword in keyword_handler_map) {
    if (event.path.indexOf(`/${keyword}/`) === 0) {
      var key = event.path.substring(keyword.length + 2);
      return keyword_handler_map[keyword](event, context, key);
    }
  }
  console.log("unknown route, event:", event);
  context.fail('unknown route');
}

function getValue(event, context, key) {
  s3.getObject({ Bucket: BUCKET, Key: key }, function (err, data) {
    if (err) {
      context.succeed({
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: '',
      })
    } else {
      returnSucceed(context, data.Body.toString());
    }
  });
}

function addValue(event, context, key) {
  var value = (event.queryStringParameters || {}).v || event.body;
  var itemKey = key + '/' + (new Date()).getTime();
  s3.putObject({
    Bucket: BUCKET,
    Key: itemKey,
    Body: value,
    ContentType: 'text/plain',
  }, function (err) {
    if (err) {
      console.log('err', err);
      console.log("Error SET object " + key + " from bucket " + BUCKET);
      context.fail('fail');
    } else {
      returnSucceed(context, 'ok');
    }
  });
}

function returnSucceed(context, body, code = 200) {
  context.succeed({
    statusCode: code,
    headers: { 'Content-Type': 'text/plain' },
    body: body,
  });
}


module.exports.handler = function (event, context) {
  console.log('event', event);
  console.log('context', context);

  var err, body = route(event, context, {
    'GET': getValue,
    'ADD': addValue,
  });
};
