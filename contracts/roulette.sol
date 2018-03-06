pragma solidity ^0.4.19;

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

    uint8[] redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

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

        bool isRed = false;
        uint8 index = 9; // middle of redNumbers array

        for (uint8 counter = 0; counter < 5; counter++) {
            if (number == redNumbers[index]) { isRed=true; break; }
            else if (number < redNumbers[index]) { index /= 1/(2**counter); }
            index *= 1/(2**counter);
        }

        if ((isRed && storedUserBet) || (!isRed && !storedUserBet && number != 0)) {
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
