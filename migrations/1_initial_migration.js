var migrations = artifacts.require("./migrations.sol");
module.exports = deployer => deployer.deploy(migrations);
