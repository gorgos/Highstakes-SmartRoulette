require('babel-polyfill');

const Roulette = artifacts.require("./roulette.sol");

contract('Roulette', function(accounts) {
  let roulette;

  it("should calculate a Roulette number.", async () => {
    const rouletteInstance = await Roulette.deployed();
    const number = await rouletteInstance.getRouletteNumber(89, {from: accounts[0]});
    assert.equal(number.toNumber(), 12, "The roulette number isn't properly calculated.")
  });

  describe('bet', () => {
    beforeEach('setup contract', async () => {
        roulette = await Roulette.deployed();
    });

    it("should calculate a Roulette number.", async () => {
      const number = await rouletteInstance.getRouletteNumber(89, {from: accounts[0]});
      assert.equal(number.toNumber(), 12, "The roulette number isn't properly calculated.")
    });
  });
});
