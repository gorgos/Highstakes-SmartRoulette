import React from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';
import format from 'biguint-format';
import crypto from 'crypto';
import bigInt from "big-integer";

import ControlBoard from './ControlBoard';
import GameOptions from './GameOptions';
import StepOverview from './StepOverview';
import RouletteWheel from './RouletteWheel';

const AWS_ENDPOINT_URL = 'https://kxeix65tni.execute-api.us-east-1.amazonaws.com/dev/';
const SET_BANK_HASH_ENDPOINT_URL = AWS_ENDPOINT_URL + 'set';
const SEND_BANK_VALUE_ENDPOINT_URL = AWS_ENDPOINT_URL + 'send';

class RouletteGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      betValue: 0.1,
      warning: '',
      step: 0,
      skipBankHashWait: false,
      skipGameEvaluation: false,
      oldSkipBankHashWait: false,
      oldSkipGameEvaluation: false,
    };

    this._onPlayRouletteButtonClick = this._onPlayRouletteButtonClick.bind(this);
    this._playRoulette = this._playRoulette.bind(this);
    this._requestBankHash = this._requestBankHash.bind(this);
    this._waitForBankHash = this._waitForBankHash.bind(this);
    this._placeBetAndUserValue = this._placeBetAndUserValue.bind(this);
    this._requestBankValue = this._requestBankValue.bind(this);
    this._waitForGameEvaluation = this._waitForGameEvaluation.bind(this);
    this._getRouletteNumber = this._getRouletteNumber.bind(this);
    this._onSkipBankHashWaitChange = this._onSkipBankHashWaitChange.bind(this);
    this._onSkipGameEvaluationWait = this._onSkipGameEvaluationWait.bind(this);
    this.setState = this.setState.bind(this);
  }

  render() {
    return (
      <div>
        <RouletteWheel ref={ wheel => this._wheel = wheel }/>
        <StepOverview
            step={ this.state.step }
            skipBankHashWait={ this.state.oldSkipBankHashWait }
            skipGameEvaluation={ this.state.oldSkipGameEvaluation }
            gameState={ this.props.gameState }
          />
        <GameOptions
            onSkipBankHashWaitChange={ this._onSkipBankHashWaitChange }
            onSkipGameEvaluationWait={ this._onSkipGameEvaluationWait }
          />
        <ControlBoard
            setState={ this.setState }
            onButtonClick={ this._onPlayRouletteButtonClick }
            color={ this.state.color }
            betValue={ this.state.betValue }
            gameState={ this.props.gameState }
            warning={ this.state.warning }
            ref={ board => this._board = board }
          />
      </div>
    );
  }

  _onSkipBankHashWaitChange(e) {
    this.setState({ skipBankHashWait: e.target.checked });
  }

  _onSkipGameEvaluationWait(e) {
    this.setState({ skipGameEvaluation: e.target.checked });
  }

  _onPlayRouletteButtonClick() {
    this.setState({ warning: '' });

    this.props.web3.eth.getAccounts(async (error, accounts) => {
      try {
        const number = await this._playRoulette(accounts[0]);
        const gameState = this._wheel._spinWheel(number, this.state.color);

        const that = this;
        setTimeout(() => {
          that.props.storeGameState(gameState);
        }, 9000);
      } catch (error) {
        console.log({ error });
        this.setState({ warning: error.message, step: 0 });
        this.props.storeGameState('');
      }
    });
  }

  async _playRoulette(userAddress) {
    if (this.props.gameState === 'loading') { throw new Error('Game is still loading.'); }
    this.props.storeGameState('loading');
    if (this.state.color === undefined) { throw new Error('Please choose color first.'); }
    if (!this._board.state.captchaResponse) { throw new Error('Please fill in captcha!'); }

    const rouletteInstance = await this.props.roulette.deployed();

    const userFunds = (await rouletteInstance.registeredFunds(userAddress)).toNumber();
    if (userFunds < this.props.web3.toWei(this.state.betValue, 'ether')) {
      throw new Error('Please increase your funds!');
    }

    const bankAddress = await rouletteInstance.bankAddress();
    const bankFunds = (await rouletteInstance.registeredFunds(bankAddress)).toNumber();

    if (bankFunds < this.props.web3.toWei(this.state.betValue, 'ether')) {
      throw new Error('Bank does not have enough funds!');
    }

    const gameRound = await rouletteInstance.gameRounds(userAddress);
    let storedBankHash = gameRound[0];
    let storedUserValue = gameRound[2].toString();

    console.log({ storedBankHash, storedUserValue });

    if (storedBankHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      // STEP 1
      const captcha = this._board.state.captchaResponse;
      storedBankHash = await this._requestBankHash(rouletteInstance, userAddress, captcha);
      if (!this.state.skipBankHashWait) {
        await this._waitForBankHash(rouletteInstance, userAddress); // STEP 2
      }
    }

    if (storedUserValue === '0') {
      storedUserValue = await this._placeBetAndUserValue(rouletteInstance, userAddress); // STEP 3
    }

    // STEP 4
    const bankValue = await this._requestBankValue(rouletteInstance, userAddress, storedBankHash);

    if (!this.state.skipGameEvaluation) {
      await this._waitForGameEvaluation(rouletteInstance, userAddress); // STEP 5
    }

    // STEP 6
    const number = await this._getRouletteNumber(
        rouletteInstance,
        userAddress,
        bankValue,
        storedUserValue,
    );

    return number;
  }

  async _requestBankHash(rouletteInstance, userAddress, captcha) {
    console.log('STEP 1: Request bank to commit hash');
    this.setState({
      step: 1,
      oldSkipBankHashWait: this.state.skipBankHashWait,
      oldSkipGameEvaluation: this.state.skipGameEvaluation,
    });
    const bankHash = await $.get(SET_BANK_HASH_ENDPOINT_URL, { userAddress, captcha });
    console.log({ bankHash });
    this._board._captcha.reset();

    return bankHash;
  }

  async _waitForBankHash(rouletteInstance, userAddress) {
    console.log('STEP 2: Wait for contract to receive hash');
    this.setState({ step: 2 });
    const bankHashSetEvent = rouletteInstance.BankHashSet({ userAddress });
    await waitForEvent(rouletteInstance, bankHashSetEvent);
    bankHashSetEvent.stopWatching();
  }

  async _placeBetAndUserValue(rouletteInstance, userAddress) {
    const number = crypto.randomBytes(32);
    const decNumber = format(number, 'dec');
    console.log({ decNumber });

    console.log('STEP 3: Place bet and set user value');
    this.setState({ step: 3 });
    await rouletteInstance.placeBet(
      this.state.color, decNumber, this.props.web3.toWei(this.state.betValue, 'ether'),
      { from: userAddress },
    );

    return decNumber;
  }

  async _requestBankValue(rouletteInstance, userAddress, bankHash) {
    console.log('STEP 4: Request bank to send own value');
    this.setState({ step: 4 });
    const bankValue = await $.get(SEND_BANK_VALUE_ENDPOINT_URL, { bankHash, userAddress });
    console.log({ bankValue });
    return bankValue;
  }

  async _waitForGameEvaluation(rouletteInstance, userAddress) {
    console.log('STEP 5: Wait for game evaluation');
    this.setState({ step: 5 });
    const evaluationFinishedEvent = rouletteInstance.EvaluationFinished({ userAddress });
    await waitForEvent(rouletteInstance, evaluationFinishedEvent);
    evaluationFinishedEvent.stopWatching();
  }

  async _getRouletteNumber(rouletteInstance, userAddress, bankValue, storedUserValue) {
    console.log('STEP 6: Get Roulette number.. good luck!');
    this.setState({ step: 6 });

    if (this.state.skipGameEvaluation) {
      return bigInt(bankValue).xor(storedUserValue).mod(37).toJSNumber();
    }

    const result = await rouletteInstance.lastRouletteNumbers(userAddress);
    return result.toNumber();
  }
}

function waitForEvent(rouletteInstance, event) {
  return new Promise((resolve, reject) => {
    event.watch((error, eventResult) => {
      if (error) { reject(error); }

      console.log({ eventResult });
      resolve(eventResult);
    });
  });
}

const mapStateToProps = state => {
  return {
    gameState: state.gameState,
    roulette: state.roulette,
    web3: state.web3,
  };
}

const mapDispatchToProps = dispatch => {
  return {
    storeGameState : gameState => dispatch({
      type : 'STORE_GAME_STATE',
      payload: gameState,
    })
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RouletteGame);

