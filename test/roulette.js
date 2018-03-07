require('babel-polyfill');
const Web3Utils = require('web3-utils');
const Roulette = artifacts.require("./roulette.sol");

contract('Roulette', function(accounts) {
  let rouletteInstance, bankAccount, userAccount;

  beforeEach('setup contract', async () => {
    rouletteInstance = await Roulette.deployed();
  });

  it("should calculate a Roulette number.", async () => {
    const number = await rouletteInstance.getRouletteNumber(145, { from: accounts[0] });
    assert.equal(number.toNumber(), 20, "The roulette number isn't properly calculated.");
  });

  describe('betting on a color', () => {
    itShouldProperlyEvaluate(accounts, true, true); // bet on red and get red
    itShouldProperlyEvaluate(accounts, true, false); // bet on red and get black
    itShouldProperlyEvaluate(accounts, false, true); // bet on black and get red
    itShouldProperlyEvaluate(accounts, false, false); // bet on black and get black
  });
});

function itShouldProperlyEvaluate(accounts, userBet, result) {
  describe(`betting on ${userBet ? 'red':'black'} and getting ${result ? 'red':'black'}`, () => {
    let rouletteInstance, bankAccount, userAccount;

    beforeEach('setup contract and place bet', async () => {
      const { userValue, bankValue, userHash, bankHash } = result ? redValues() : blackValues();
      rouletteInstance = await Roulette.deployed();
      bankAccount = accounts[0];
      userAccount = accounts[1];
      await rouletteInstance.retrieveMoney({ from: bankAccount });
      await rouletteInstance.retrieveMoney({ from: userAccount });
      await rouletteInstance.increaseBankFunds({ from: bankAccount, value: 100 });
      await rouletteInstance.placeBet(userBet, userHash, { from: userAccount, value: 10 });
      await rouletteInstance.setBankHash(bankHash, userAccount, { from: bankAccount });
      await rouletteInstance.sendUserValue(userValue, { from: userAccount });
      await rouletteInstance.sendBankValue(bankValue, userAccount, { from: bankAccount });
    });

    it("should evaluate the bet properly.", async () => {
      const number = await rouletteInstance.evaluateBet({ from: userAccount });
      const registeredBankFunds = (await rouletteInstance.registeredFunds(bankAccount)).toNumber();
      const registeredUserFunds = (await rouletteInstance.registeredFunds(userAccount)).toNumber();

      const bankFunds = userBet === result ? 90 : 110;
      const userFunds = userBet === result ? 20 : 0;

      assert.equal(registeredBankFunds, bankFunds, "The bank funds are not propery evaluated.");
      assert.equal(registeredUserFunds, userFunds, "The user funds are not propery evaluated.");
    });
  });
}

function redValues() {
  // 238 xor 123 = 149 => 21 (red)
  return {
    userValue: 238,
    bankValue: 123,
    userHash: sha('0xee'),
    bankHash: sha('0x7B'),
  };
}

function blackValues() {
  // 234 xor 123 = 145 => 20 (black)
  return {
    userValue: 234,
    bankValue: 123,
    userHash: sha('0xea'),
    bankHash: sha('0x7B'),
  };
}

function sha(number) {
  return Web3Utils.sha3(number);
}
