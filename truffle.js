var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
     host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/iwrkJXfZBNem25lLlBFR")
      },
      gas: 4698712,
      network_id: 3,
      from: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
    },
  },
};
