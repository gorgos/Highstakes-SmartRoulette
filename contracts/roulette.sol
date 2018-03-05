pragma solidity ^0.4.18;

contract owned {
    function owned() public { bankAddress = msg.sender; }
    address bankAddress;

    modifier onlyOwner {
        require(msg.sender == bankAddress);
        _;
    }
}


contract roulette is owned {
    // bank
    bytes32 storedBankHash;
    uint8 storedBankValue;

    // user
    bytes32 storedUserHash;
    uint8 storedUserValue;
    address userAddress;

    // game
    bool storedUserBet;
    uint256 blockWhenValuesSubmitted;
    mapping (address => uint256) public registeredFunds;
    mapping (address => uint256) public lockedFunds;

    function resetContract() public onlyOwner {
        storedBankHash = 0x0;
        storedBankValue = 0;
        storedUserHash = 0x0;
        storedUserValue = 0;
        userAddress = 0x0;
        storedUserBet = false;
        blockWhenValuesSubmitted = 0;
    }

    function increaseBankFunds() public payable onlyOwner {
        require(msg.value > 0);
        registeredFunds[msg.sender] += msg.value;
    }

    function retrieveMoney() public {
        msg.sender.transfer(registeredFunds[msg.sender]);
    }

    function showBankAddress() public view returns (address) {
        return bankAddress;
    }

    function showBalance(address _address) public view returns (uint256) {
        return registeredFunds[_address];
    }

    function placeBet(bool _bet, bytes32 _hash) public payable {
        require(userAddress == 0 && registeredFunds[bankAddress] >= msg.value);

        userAddress = msg.sender;
        storedUserHash = _hash;
        storedUserBet = _bet;
        lockedFunds[msg.sender] = msg.value;
        registeredFunds[bankAddress] -= msg.value;
        lockedFunds[bankAddress] = msg.value;
    }

    function setBankHash(bytes32 _hash) public onlyOwner {
        require(storedUserHash != 0);
        storedBankHash = _hash;
        blockWhenValuesSubmitted = block.number;
    }

    function sendBankValue(uint8 _value) public onlyOwner {
        require(keccak256(_value) == storedBankHash);
        storedBankValue = _value;
    }

    function sendUserValue(uint8 _value) public {
        require(keccak256(_value) == storedUserHash);
        storedUserValue = _value;
    }

    function checkUserValueTimeout() public onlyOwner {
        require(block.number > (blockWhenValuesSubmitted + 1000) && storedUserValue != 0);
        registeredFunds[bankAddress] += lockedFunds[userAddress];
        lockedFunds[userAddress] = 0;
    }

    function evaluateBet() public returns (uint8) {
        require(storedUserValue != 0 && storedBankValue != 0);
        uint8 random = storedBankValue ^ storedUserValue;
        uint8 number = getRouletteNumber(random);
        uint256 winningAmount = lockedFunds[userAddress] * 2;
        address winner;

        if ((number % 2 != 0 && storedUserBet) || (number != 0 && !storedUserBet)) {
            winner = userAddress;
        } else {
            winner = bankAddress;
        }

        lockedFunds[bankAddress] = 0;
        lockedFunds[userAddress] = 0;
        registeredFunds[winner] += winningAmount;
        return number;
    }

    function debugShowHashForValue(uint8 _value) public pure returns (bytes32) {
        return keccak256(_value);
    }

    function getRouletteNumber(uint8 _random) public pure returns (uint8) {
        // uint256 max = 2**256 - 1;
        uint8 numberDistance = 7; // uint256: max / 37;
        return _random / numberDistance;
    }
}
