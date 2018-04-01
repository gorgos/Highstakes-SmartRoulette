pragma solidity ^0.4.19;

contract owned {
    function owned() public { bankAddress = msg.sender; }
    address public bankAddress;

    modifier onlyOwner {
        require(msg.sender == bankAddress);
        _;
    }
}

contract roulette is owned {

    struct GameRound {
        // bank
        bytes32 storedBankHash;
        uint256 storedBankValue;

        // user
        uint256 storedUserValue;

        // game
        bool storedUserBet;
        uint256 blockWhenValueSubmitted;
        uint256 lockedFunds;
    }

    event BankHashSet(address userAddress);
    event FundsChanged(address _address);
    event EvaluationFinished(address userAddress);

    mapping (address => GameRound) public gameRounds;
    mapping (address => uint256) public lastRouletteNumbers;
    mapping (address => uint256) public registeredFunds;

    bool[37] numberIsRed = [false, true, false, true, false, true, false, true, false, true, false, false, true, false, true, false, true, false, true, true, false, true, false, true, false, true, false, true, false, false, true, false, true, false, true, false, true];

    function resetContractFor(address _address) private {
        gameRounds[_address] = GameRound(0x0, 0, 0, false, 0, 0);
    }

    function increaseFunds() external payable {
        require(msg.value > 0);
        registeredFunds[msg.sender] += msg.value;
        FundsChanged(msg.sender);
    }

    function retrieveMoney() external {
        require (registeredFunds[msg.sender] > 0);

        uint256 funds = registeredFunds[msg.sender];
        registeredFunds[msg.sender] = 0;
        FundsChanged(msg.sender);

        msg.sender.transfer(funds);
    }

    function placeBet(bool _bet, uint256 _value, uint256 _betAmount) external {
        require(_value != 0);
        require(registeredFunds[bankAddress] >= _betAmount);
        require(registeredFunds[msg.sender] >= _betAmount);

        gameRounds[msg.sender].storedUserValue = _value;
        gameRounds[msg.sender].storedUserBet = _bet;
        gameRounds[msg.sender].lockedFunds = _betAmount * 2;
        registeredFunds[msg.sender] -= _betAmount;
        registeredFunds[bankAddress] -= _betAmount;

        FundsChanged(msg.sender);
        FundsChanged(bankAddress);
    }

    function setBankHash(bytes32 _hash, address _address) external onlyOwner {
        require(gameRounds[_address].storedBankHash == 0);

        gameRounds[_address].storedBankHash = _hash;
        BankHashSet(_address);
    }

    function sendBankValue(uint256 _value, address _address) external onlyOwner {
        require(keccak256(_value) == gameRounds[_address].storedBankHash);
        require(gameRounds[_address].storedUserValue != 0);
        require(gameRounds[_address].storedBankValue == 0);

        gameRounds[_address].storedBankValue = _value;
        gameRounds[_address].blockWhenValueSubmitted = block.number;

        evaluateBet(_address);
    }

    function sendUserValue(uint256 _value) external {
        require(gameRounds[msg.sender].storedBankHash != 0);

        gameRounds[msg.sender].storedUserValue = _value;
    }

    function checkBankValueTimeout() external onlyOwner {
        require(block.number > (gameRounds[msg.sender].blockWhenValueSubmitted + 300));
        require(gameRounds[msg.sender].storedBankHash != 0);
        require(gameRounds[msg.sender].storedBankValue == 0);
        require(gameRounds[msg.sender].storedUserValue != 0);

        registeredFunds[msg.sender] += gameRounds[msg.sender].lockedFunds;
        FundsChanged(msg.sender);
        resetContractFor(msg.sender);
    }

    function evaluateBet(address _address) private {
        uint256 random = gameRounds[_address].storedBankValue ^ gameRounds[_address].storedUserValue;
        uint256 number = getRouletteNumber(random);
        uint256 winningAmount = gameRounds[_address].lockedFunds;
        address winner;

        bool isRed = numberIsRed[number];
        bool userBet = gameRounds[_address].storedUserBet;

        if ((isRed && userBet) || (!isRed && !userBet && number != 0)) {
            winner = _address;
        } else {
            winner = bankAddress;
        }

        registeredFunds[winner] += winningAmount;
        lastRouletteNumbers[_address] = number;
        resetContractFor(_address);

        FundsChanged(winner);
        EvaluationFinished(_address);
    }

    function debugShowHashForValue(uint256 _value) external pure returns (bytes32) {
        return keccak256(_value);
    }

    function getRouletteNumber(uint256 _random) private pure returns (uint8) {
        return uint8(_random % 37);
    }
}
