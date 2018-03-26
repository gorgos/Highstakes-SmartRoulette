require('babel-polyfill');
const Roulette = artifacts.require("./roulette.sol");

contract('Roulette', accounts => {
  let rouletteInstance, bankAccount, userAccount;

  beforeEach('setup contract', async () => {
    rouletteInstance = await Roulette.deployed();
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
      const { userValue, bankValue } = result ? redValues() : blackValues();
      rouletteInstance = await Roulette.deployed();
      bankAccount = accounts[0];
      userAccount = accounts[1];
      const bankHash = await rouletteInstance.debugShowHashForValue(bankValue);

      try { await rouletteInstance.retrieveMoney({ from: bankAccount }); } catch(e) {}
      try { await rouletteInstance.retrieveMoney({ from: userAccount }); } catch(e) {}
      await rouletteInstance.increaseFunds({ from: bankAccount, value: 100 });
      await rouletteInstance.increaseFunds({ from: userAccount, value: 10 });
      await rouletteInstance.setBankHash(bankHash, userAccount, { from: bankAccount });
      await rouletteInstance.placeBet(userBet, userValue, 10, { from: userAccount });
      await rouletteInstance.sendBankValue(bankValue, userAccount, { from: bankAccount });
    });

    it("should evaluate the bet properly.", async () => {
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
  // (238 xor 123) % 37 = 1 (red)
  return {
    userValue: 238,
    bankValue: 123,
  };
}

function blackValues() {
  // (235 xor 123) % 37 = 33 (black)
  return {
    userValue: 235,
    bankValue: 123,
  };
}
