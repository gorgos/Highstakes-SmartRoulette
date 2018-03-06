require('babel-polyfill');

const Roulette = artifacts.require("./roulette.sol");

contract('Roulette', function(accounts) {
  it("should calculate a Roulette number.", async () => {
    const rouletteInstance = await Roulette.deployed();
    const number = await rouletteInstance.getRouletteNumber(89, {from: accounts[0]});
    assert.equal(number.toNumber(), 12, "The roulette number isn't properly calculated.")
  });
});
