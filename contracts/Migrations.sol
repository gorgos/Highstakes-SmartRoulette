pragma solidity ^0.4.2;

contract migrations {
  address public owner;
  uint public last_completed_migration;

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function migrations() public {
    owner = msg.sender;
  }

  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }

  function upgrade(address new_address) public restricted {
    migrations upgraded = migrations(new_address);
    upgraded.setCompleted(last_completed_migration);
  }
}
