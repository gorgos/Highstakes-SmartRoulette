# High-stakes Smart Roulette
Smart Contract, AWS Lambda and React App for securely playing Roulette.

Smart contracts in Ethereum allow anyone to verify its source code. This enables smart contract gambles, where any participant can be certain, that the bank is in fact not cheating on you. If we want to play high-stakes games, there is a potential risk though.

## The problem
The miner incentive to cheat becomes a serious threat, because we might a rely on the block hash for our random number generation. Playing high-stakes implies an increased chance for the current block reward to be lower than the expected gain from the gamble. This encourages a miner to cheat by not publishing a newly found block if its block hash implies loosing the gamble.

## The solution
A commitment-based approach for generating the random number solves the miner incentive issue. Both parties, i.e., the bank and the player, commit to a secret value `V` by calculating the commitment `C = SHA(V)`. They first send `C` and wait for the other person to send C. Subsequently they reveal their secret value `V` and the smart contract can calculate the random number as <code>V<sub>b</sub> XOR V<sub>p</sub></code>.

1. The bank chooses a hash and submits it to the smart contract.

2. The player submits a value to the smart contract.

3. The bank submits the value fitting to the previously submitted hash.

4. Smart contract calculates a roulette number (0-36) by calculating (bank value XOR player value) % 37.

## Architecture
<p align="center">
  <img src="https://user-images.githubusercontent.com/659390/38194925-f93a5644-367a-11e8-9f70-e6be9accd3a7.png"/>
</p>

- Smart Contract: The key component of the application. Is used for all game functions.
- Front-end: The React application that runs inside a players browser.
- [AWS Lambda](https://aws.amazon.com/lambda): The nodejs server application that represents the bank.
- [Netlify](https://netlify.com/): The hosting service for the Front-end application.
- [serverless](https://serverless.com/): The deployment tool for AWS lambda functions.
- [AWS S3](https://aws.amazon.com/s3/): The encrypted database of the bank for storing and retrieving secret values.
- [Web3](https://github.com/ethereum/web3.js): The JavaScript framework for talking with smart contracts.
- [MetaMask](https://github.com/MetaMask/metamask-extension/): The browser plugin for verifying transactions.
- [Infura](https://github.com/INFURA/infura/): An Ethereum node service to talk with the Ethereum blockchain without running your own node.
- [Truffle](https://github.com/trufflesuite/truffle): A framework that provides a default front-end application as well as tools for compiling, deploying and maintaining the deployed smart contracts.

## Deployed contract

Rinkeby: [0xe4f53c8de2020de632b496290375a419b93f9dc2](https://rinkeby.etherscan.io/address/0xe4f53c8de2020de632b496290375a419b93f9dc2)

## Game round options
### Skip bank hash waiting option
Skipping the confirmation from the smart contract that the bank has set its hash significantly decreases the time for a game round. However, in rare situations it might lead to a failed round when in fact the user transaction reaches the smart contract first. Furthermore, it poses a security issue because the bank can look at the pending transactions and quickly send a new transaction with a high gas price for setting its hash. Due to the high gas price it might overtake the user transaction giving the bank the possibility to cheat. Any such cheating would be public and can be detected by a user.

### Game evaluation in JavaScript option
Since we know the bank and user value, we can calculate the result of the round in the front-end. That is why we do not have to wait for the evalutation inside the smart contract. However, it means a user might have to wait a little bit before he can play the next round. The smart contract only allows one game round per user at the same time.

## Changelog

### v0.0.3
Google reCAPTCHA, Code clean-up, User Interface and design improvements

### v0.0.2
The commitment scheme was improved:
1. Bank sends commitment
2. Player sends value
3. Bank reveals value

Two options for speedup:

(1) Skip waiting for confirmation for bank hash set

(2) Game evaluation in JavaScript

### v0.0.1
The commitment scheme worked as followed:
1. Player sends commitment
2. Bank sends commitment
3. Player reveals value
4. Bank reveals value
