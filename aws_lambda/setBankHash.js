'use strict';

const crypto = require('crypto');
const format = require('biguint-format');

const Web3 = require('web3');
const Web3Utils = require('web3-utils');
const Tx = require('ethereumjs-tx');

const BUCKET = 'my-secure-bucket-for-temporary-storage';
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ sslEnabled: true });

const googleRecaptcha = require('google-recaptcha');

const BANK_ADDRESS = '0x15ae150d7dC03d3B635EE90b85219dBFe071ED35';
const CONTRACT_ADDRESS = '0xe4f53c8de2020de632b496290375a419b93f9dc2';
const NETWORK_NAME = 'rinkeby';

const NETWORK_IDS = {
  // mainnet: 1,
  ropsten: 2,
  rinkeby: 4,
  kovan: 42
};

const abi = [{"constant":false,"inputs":[{"name":"_bet","type":"bool"},{"name":"_value","type":"uint256"},{"name":"_betAmount","type":"uint256"}],"name":"placeBet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_hash","type":"bytes32"},{"name":"_address","type":"address"}],"name":"setBankHash","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_value","type":"uint256"}],"name":"debugShowHashForValue","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"gameRounds","outputs":[{"name":"storedBankHash","type":"bytes32"},{"name":"storedBankValue","type":"uint256"},{"name":"storedUserValue","type":"uint256"},{"name":"storedUserBet","type":"bool"},{"name":"blockWhenValueSubmitted","type":"uint256"},{"name":"lockedFunds","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"checkBankValueTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"sendUserValue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"bankAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"lastRouletteNumbers","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"registeredFunds","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"increaseFunds","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"},{"name":"_address","type":"address"}],"name":"sendBankValue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"retrieveMoney","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"userAddress","type":"address"}],"name":"BankHashSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_address","type":"address"}],"name":"FundsChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"userAddress","type":"address"}],"name":"EvaluationFinished","type":"event"}];

function random(qty) {
    return crypto.randomBytes(qty);
}

module.exports.handler = (event, context, callback) => {
  process.chdir('/tmp');
  const queryParameter = event["queryStringParameters"];
  const userAddress = queryParameter ? queryParameter['userAddress'] : event.userAddress;

  const captcha = new googleRecaptcha({ secret: process.env.CAPTCHA_KEY });
  const captchaResponse = queryParameter ? queryParameter['captcha'] : event.captcha;
  captcha.verify({ response: captchaResponse }, error => {
    if (error) { returnFail(context, error); }

    const etherUrl = `https://${NETWORK_NAME}.infura.io/${process.env.INFURA_API_KEY}`;
    const web3 = new Web3(new Web3.providers.HttpProvider(etherUrl));

    const number = random(32);
    const decNumber = format(number, 'dec');
    const hexNumber = format(number, 'hex');
    const hash = sha(`0x${hexNumber}`);

    const rouletteInstance = web3.eth.contract(abi).at(CONTRACT_ADDRESS);
    const data = rouletteInstance.setBankHash.getData(hash, userAddress, { from: BANK_ADDRESS });
    const gasPrice = 9;
    const gasLimit = 3000000;

    const rawTransaction = {
      "from": BANK_ADDRESS,
      "nonce": web3.eth.getTransactionCount(BANK_ADDRESS),
      "gasPrice": web3.toHex(gasPrice * 1e9),
      "gasLimit": web3.toHex(gasLimit),
      "to": CONTRACT_ADDRESS,
      "value": "0x00",
      "data": data,
      "chainId": NETWORK_IDS[NETWORK_NAME],
    };

    const privateKey = process.env.PRIVATE_KEY;
    const privKey = new Buffer(privateKey, 'hex');
    const tx = new Tx(rawTransaction);

    tx.sign(privKey);
    const serializedTx = tx.serialize();

    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), (error, result) => {
      if (!error) { addValue(context, decNumber, hash, userAddress); }
      else { returnFail(context, error); }
    });
  });
};

function addValue(context, value, hash, userAddress) {
  const itemKey = `testOn${NETWORK_NAME}/${userAddress}/${hash}`;

  s3.putObject({
    Bucket: BUCKET,
    Key: itemKey,
    Body: value,
    ContentType: 'text/plain',
  }, err => {
    if (err) {
      console.log(`Error SET object ${value} with key ${itemKey}`
          + ` from bucket ${BUCKET} for user address ${userAddress}`);
      returnFail(context, err);
    } else {
      returnSucceed(context, hash);
    }
  });
}

function returnFail(context, error, code = 504) {
  console.log({ error });
  context.fail({
    statusCode: code,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin' : '*', // TODO https://roulette.netlify.com',
      'Access-Control-Allow-Credentials' : true,
    },
    body: error,
  });
}

function returnSucceed(context, body, code = 200) {
  context.succeed({
    statusCode: code,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin' : '*', // TODO https://roulette.netlify.com',
      'Access-Control-Allow-Credentials' : true,
    },
    body: body,
  });
}


function sha(number) {
  return Web3Utils.sha3(number);
}
