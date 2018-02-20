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
    uint256 storedBankValue;

    // user
    bytes32 storedUserHash;
    uint256 storedUserValue;
    address userAddress;

    // game
    bool storedUserBet;
    uint blockWhenValuesSubmitted;
    mapping (address => uint256) public registeredFunds;

    function resetContract() public onlyOwner {
        storedBankHash = 0x0;
        storedBankValue = 0;
        storedUserHash = 0x0;
        storedUserValue = 0;
        userAddress = 0x0;
        storedUserBet = false;
        blockWhenValuesSubmitted = 0;
    }

    function increaseBankFunds() public payable {
        registeredFunds[bankAddress] = msg.value;
    }

    function retrieveMoney(address _address) public {
        _address.transfer(registeredFunds[_address]);
    }

    function showBankAddress() public view returns (address) {
        return bankAddress;
    }

    function showBalance(address _address) public view returns (uint256) {
        return registeredFunds[_address];
    }

    function placeBet(bool _bet, address _userAddress, bytes32 _hash) public payable {
        require(userAddress == 0);

        userAddress = _userAddress;
        storedUserHash = _hash;
        storedUserBet = _bet;
        registeredFunds[msg.sender] = msg.value;
    }

    function setBankHash(bytes32 _hash) public onlyOwner {
        storedBankHash = _hash;
        if (storedUserHash != 0) { blockWhenValuesSubmitted = block.number; }
    }

    function sendBankValue(uint256 _value) public onlyOwner {
        require(keccak256(_value) == storedBankHash);
        storedBankValue = _value;
    }

    function sendUserValue(uint256 _value) public {
       require(keccak256(_value) == storedUserHash);
        storedUserValue = _value;
    }

    function checkUserValueTimeout() public onlyOwner {
        require(block.number > (blockWhenValuesSubmitted + 1000) && storedUserValue != 0);
        registeredFunds[bankAddress] += registeredFunds[userAddress];
        registeredFunds[userAddress] = 0;
    }

    function evaluateBet() public {
        require(storedUserValue != 0 && storedBankValue != 0);
        uint256 random = storedBankValue ^ storedUserValue;
        uint256 number = getRouletteNumber(random);
        uint256 winningAmount = registeredFunds[userAddress] * 2;
        address winner;

        if ((number % 2 != 0 && storedUserBet) || (number != 0 && !storedUserBet)) {
            registeredFunds[userAddress] *= 2 ;
            winner = userAddress;
        } else {
            winner = bankAddress;
        }

        registeredFunds[winner] += winningAmount;
    }

    function debugShowHashForValue(uint256 _value) public pure returns (bytes32) {
        return keccak256(_value);
    }

    function getRouletteNumber(uint256 _random) public pure returns (uint256) {
        uint256 max = 2**256 - 1;
        uint256 numberDistance = max / 37;
        return _random / numberDistance;
    }
}
