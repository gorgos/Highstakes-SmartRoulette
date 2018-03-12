const replace = require('replace');
const roulette = require('../build/contracts/roulette.json');

replace({
  regex: "const abi = [^;]*;",
  replacement: `const abi = ${JSON.stringify(roulette.abi)};`,
  paths: ['./aws_lambda/setBankHash.js', './aws_lambda/sendBankValue.js'],
});

replace({
  regex: "const CONTRACT_ADDRESS = '[^']*';",
  replacement: `const CONTRACT_ADDRESS = '${roulette.networks["4"].address}';`,
  paths: ['./aws_lambda/setBankHash.js', './aws_lambda/sendBankValue.js'],
});
