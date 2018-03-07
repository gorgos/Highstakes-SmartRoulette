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

    struct GameRound {
        // bank
        bytes32 storedBankHash;
        uint8 storedBankValue;

        // user
        bytes32 storedUserHash;
        uint8 storedUserValue;

        // game
        bool storedUserBet;
        uint256 blockWhenValueSubmitted;
        uint256 lockedFunds;
    }

    mapping (address => GameRound) gameRounds;
    mapping (address => uint256) public registeredFunds;

    bool[37] numberIsRed = [false, true, false, true, false, true, false, true, false, true, false, false, true, false, true, false, true, false, true, true, false, true, false, true, false, true, false, true, false, false, true, false, true, false, true, false, true];

    function resetContractFor(address _address) private {
        gameRounds[_address] = GameRound(0x0, 0, 0x0, 0, false, 0, 0);
    }

    function increaseBankFunds() public payable onlyOwner {
        require(msg.value > 0);
        registeredFunds[msg.sender] += msg.value;
    }

    function retrieveMoney() public {
        registeredFunds[msg.sender] = 0;
        msg.sender.transfer(registeredFunds[msg.sender]);
    }

    function showBankAddress() public view returns (address) {
        return bankAddress;
    }

    function showBalance(address _address) public view returns (uint256) {
        return registeredFunds[_address];
    }

    function placeBet(bool _bet, bytes32 _hash) public payable {
        require(gameRounds[msg.sender].storedUserHash == 0);
        require(_hash != 0);
        require(registeredFunds[bankAddress] >= msg.value);

        gameRounds[msg.sender].storedUserHash = _hash;
        gameRounds[msg.sender].storedUserBet = _bet;
        gameRounds[msg.sender].lockedFunds = msg.value * 2;
        registeredFunds[bankAddress] -= msg.value;
    }

    function setBankHash(bytes32 _hash, address _address) public onlyOwner {
        require(gameRounds[_address].storedUserHash != 0);

        gameRounds[_address].storedBankHash = _hash;
    }

    function sendBankValue(uint8 _value, address _address) public onlyOwner {
        require(keccak256(_value) == gameRounds[_address].storedBankHash);
        require(gameRounds[_address].storedUserValue != 0);

        gameRounds[_address].storedBankValue = _value;
        gameRounds[_address].blockWhenValueSubmitted = block.number;
    }

    function sendUserValue(uint8 _value) public {
        require(keccak256(_value) == gameRounds[msg.sender].storedUserHash);

        gameRounds[msg.sender].storedUserValue = _value;
    }

    function checkUserValueTimeout(address _address) public onlyOwner {
        require(block.number > (gameRounds[_address].blockWhenValueSubmitted + 1000));
        require(gameRounds[_address].storedUserValue != 0);

        registeredFunds[bankAddress] += gameRounds[_address].lockedFunds;
        resetContractFor(_address);
    }

    function evaluateBet() public returns (uint8) {
        GameRound memory round = gameRounds[msg.sender];

        require(round.storedUserValue != 0);
        require(round.storedBankValue != 0);

        uint8 random = round.storedBankValue ^ round.storedUserValue;
        uint8 number = getRouletteNumber(random);
        uint256 winningAmount = round.lockedFunds;
        address winner;

        bool _isRed = numberIsRed[number];
        bool userBet = round.storedUserBet;

        if ((_isRed && userBet) || (!_isRed && !userBet && number != 0)) {
            winner = msg.sender;
        } else {
            winner = bankAddress;
        }

        registeredFunds[winner] += winningAmount;
        resetContractFor(msg.sender);
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
