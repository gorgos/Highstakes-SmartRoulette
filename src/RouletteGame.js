import React from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';
import format from 'biguint-format';
import crypto from 'crypto';
import RouletteWheel from './RouletteWheel';

import ReCAPTCHA from 'react-google-recaptcha';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';

import { ReactSpinner } from 'react-spinning-wheel';
import 'react-spinning-wheel/dist/style.css';

const AWS_ENDPOINT_URL = 'https://kxeix65tni.execute-api.us-east-1.amazonaws.com/dev/';
const SET_BANK_HASH_ENDPOINT_URL = AWS_ENDPOINT_URL + 'set';
const SEND_BANK_VALUE_ENDPOINT_URL = AWS_ENDPOINT_URL + 'send';

class RouletteGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      betValue: 0.1,
      captchaResponse: '',
      chooseColorHint: false,
      step: 0,
      skipBankHashWait: false,
      skipGameEvaluation: false,
    };

    this._onColorButtonClick = this._onColorButtonClick.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
    this._onBetValueChange = this._onBetValueChange.bind(this);
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
        <div className="step-overview">
          <ul className="step-list" style={{ display: this.state.step === 0 ? 'none' : '' }}>
            { this.state.step > 0 && <li>STEP 1: Request bank to commit hash</li> }
            { this.state.step > 1 &&
              <li>
                <b style={{ color: '#e7ff3f' }}>{ this.state.skipBankHashWait ? 'Skipping ':'' }</b>
                STEP 2: Wait for contract to receive hash
              </li>
            }
            { this.state.step > 2 && <li>STEP 3: Place bet and set user value</li> }
            { this.state.step > 3 && <li>STEP 4: Request bank to send own value</li> }
            { this.state.step > 4 &&
              <li>
                <b style={{color: '#e7ff3f'}}>{ this.state.skipGameEvaluation ? 'Skipping ':'' }</b>
                STEP 5: Wait for game evaluation
              </li>
            }
            { this.state.step > 5 && <li>STEP 6: Get Roulette number.. good luck!</li> }
          </ul>
          { this._gameIsLoading() && <ReactSpinner/> }
        </div>
        <div className="game-options">
          <div>
            <input
                id="skipBankHashWait"
                type="checkbox"
                onChange={ this._onSkipBankHashWaitChange }
              />
            <label htmlFor="skipBankHashWait">{' '}Skip waiting for bank hash?</label>
          </div>
          <div>
            <input
                id="skipGameEvaluationWait"
                type="checkbox"
                onChange={ this._onSkipGameEvaluationWait }
              />
            <label htmlFor="skipGameEvaluationWait">{' '}Pre-calculate and show game result?</label>
          </div>
        </div>
        <div className="control">
          <div>
            <Slider
                min={ 0.1 }
                max={ 0.5 }
                step={ 0.1 }
                value={ this.state.betValue }
                onChange={ this._onBetValueChange }
              />
            <div
                className="button redbg"
                onClick={ () => this._onColorButtonClick(1) }
                style={{ border: `${this.state.color === 1 ? '3px solid white' : ''}`}}
              >
                Red
            </div>
            <div
                className="button greybg"
                onClick={ () => this._onColorButtonClick(0) }
                style={{ border: `${this.state.color === 0 ? '3px solid white' : ''}`}}
              >
              Black
            </div>
            <div
                className="button button-spin"
                onClick={ this._onButtonClick }
              >
              Spin
            </div>
            <ReCAPTCHA
                sitekey="6Lct9kwUAAAAADmFzu2nG0avAbXmxk2E-DcVOeS8"
                onChange={ value => this.setState({ captchaResponse: value }) }
                theme="dark"
                size="invisible"
              />
            <b>{`Current bet amount: ${this.state.betValue} ETH`}</b>
            { this.state.chooseColorHint &&
              <span><br /><b style={{ color: '#e7ff3f' }}>Please choose color first.</b></span>
            }
            { this.props.gameState === 'won' &&
              <span><br /><b style={{ color: '#e7ff3f' }}>Congratulations, you won! :)</b></span>
            }
            { this.props.gameState === 'lost' &&
              <span><br /><b style={{ color: '#e7ff3f' }}>Sorry, you lost. :(</b></span>
            }
          </div>
        </div>
      </div>
    );
  }

  _onSkipBankHashWaitChange(e) {
    this.setState({ skipBankHashWait: e.target.checked });
  }

  _onSkipGameEvaluationWait(e) {
    this.setState({ skipGameEvaluation: e.target.checked });
  }

  _gameIsLoading() {
    return this.props.gameState === 'loading';
  }

  _onBetValueChange(value) {
    const betValue = Math.round(value * 100) / 100;
    this.setState({ betValue });
  }

  _onColorButtonClick(color) {
    if (this._gameIsLoading()) { return; }
    this.setState({ color: color });
  }

  _onButtonClick() {
    if (this._gameIsLoading()) { return; }
    if (this.state.color === undefined) {
      this.setState({ chooseColorHint: true });
      return;
    }
    this.props.storeGameState('loading');
    this.setState({ chooseColorHint: false });

    this.props.web3.eth.getAccounts(async (error, accounts) => {
      try {
        const number = await this._playRoulette(accounts[0]);
        const gameState = this._wheel._spinWheel(number, this.state.color);

        const that = this;
        setTimeout(() => {
          that.props.storeGameState(gameState);
        }, 9000);
      } catch (e) {
        console.log({ e });
        this.setState({ step: 0 });
        this.props.storeGameState('');
      }
    });
  }

  async _playRoulette(userAddress) {
    const rouletteInstance = await this.props.roulette.deployed();

    const userFunds = (await rouletteInstance.registeredFunds(userAddress)).toNumber();
    if (userFunds < this.props.web3.toWei(this.state.betValue, 'ether')) {
      console.log('Please increase your funds!');
      return;
    }

    const bankAddress = await rouletteInstance.bankAddress();
    const bankFunds = await rouletteInstance.registeredFunds(bankAddress);

    if (bankFunds < this.props.web3.toWei(this.state.betValue, 'ether')) {
      console.log('Bank does not have enough funds!');
      return;
    }

    const gameRound = await rouletteInstance.gameRounds(userAddress);
    let storedBankHash = gameRound[0];
    let storedUserValue = gameRound[2].toNumber();

    console.log({ storedBankHash, storedUserValue });

    if (storedBankHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      storedBankHash = await this._requestBankHash(rouletteInstance, userAddress); // STEP 1
      if (!this.state.skipBankHashWait) {
        await this._waitForBankHash(rouletteInstance, userAddress); // STEP 2
      }
    }

    if (storedUserValue === 0) {
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

  async _requestBankHash(rouletteInstance, userAddress) {
    console.log('STEP 1: Request bank to commit hash');
    this.setState({ step: 1 });
    const captcha = this.state.captchaResponse;
    const bankHash = await $.get(SET_BANK_HASH_ENDPOINT_URL, { userAddress, captcha });
    console.log({ bankHash });
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
    const number = random(1);
    const decNumber = format(number, 'dec');
    const hexNumber = format(number, 'hex');
    console.log('Numbers:', { decNumber, hexNumber });

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
    const captcha = this.state.captchaResponse;
    const bankValue = await $.get(
      SEND_BANK_VALUE_ENDPOINT_URL,
      { bankHash, userAddress, captcha },
    );
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
      return Math.round((bankValue ^ storedUserValue) / 7);
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

function random(qty) {
  return crypto.randomBytes(qty);
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

