var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var Roulette = artifacts.require("./Roulette.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(Roulette);
};
