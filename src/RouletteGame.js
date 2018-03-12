import React from 'react';
import { connect } from 'react-redux';
import Web3Utils from 'web3-utils';
import $ from 'jquery';
import format from 'biguint-format';
import crypto from 'crypto';
import RouletteWheel from './RouletteWheel';

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
    this.state = { chooseColorHint: false, betValue: 0.1 };
    this._onColorButtonClick = this._onColorButtonClick.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
    this._onBetValueChange = this._onBetValueChange.bind(this);
    this._playRoulette = this._playRoulette.bind(this);
    this.setState = this.setState.bind(this);
  }

  render() {
    return (
      <div>
        <RouletteWheel ref={ wheel => this._wheel = wheel }/>
        <div className="step-overview">
          <ul className="step-list">
            { this.state.step > 0 && <li>STEP 1: Place bet and set user hash</li> }
            { this.state.step > 1 && <li>STEP 2: Request server to set hash</li> }
            { this.state.step > 2 && <li>STEP 3: Send own value</li> }
            { this.state.step > 3 && <li>STEP 4: Request server to send own value</li> }
            { this.state.step > 4 && <li>STEP 5: Request game evaluation</li> }
            { this.state.step > 5 && <li>STEP 6: Get number of evaluation</li> }
          </ul>
        </div>
        <div className="control">
          <div>
            <Slider
                min={ 0.1 }
                max={ 0.5 }
                step={ 0.1 }
                value={ this.state.betValue }
                onChange={ this._onBetValueChange }
                format={ value => Math.round(value * 100) / 100 }
              />
            <div
                disabled={ this._gameIsLoading() }
                className="button redbg"
                onClick={ () => this._onColorButtonClick(1) }
                style={{ border: `${this.state.color === 1 ? '3px solid white' : ''}`}}
              >
                Red
            </div>
            <div
                disabled={ this._gameIsLoading() }
                className="button greybg"
                onClick={ () => this._onColorButtonClick(0) }
                style={{ border: `${this.state.color === 0 ? '3px solid white' : ''}`}}
              >
              Black
            </div>
            <div
                disabled={ this._gameIsLoading() }
                className="button button-spin"
                onClick={ this._onButtonClick }
              >
              Spin
            </div>
            { this.props.gameState === 'loading' && <ReactSpinner/> }
            { this.state.chooseColorHint &&
              <b style={{ color: 'white' }}>Please choose color</b>
            }
            { this.props.gameState === 'won' &&
              <b style={{ color: 'white' }}>Congratulations, you won!!!</b>
            }
            { this.props.gameState === 'lost' &&
              <b style={{ color: 'white' }}>Sorry, you lost. Please try again.</b>
            }
          </div>
        </div>
      </div>
    );
  }

  _gameIsLoading() {
    return this.props.gameState === 'loading';
  }

  _onBetValueChange(betValue) {
    this.setState({ betValue });
  }

  _onColorButtonClick(color) {
    this.setState({ color: color });
  }

  _onButtonClick() {
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
        }, 8750);
      } catch (e) {
        console.log({ e });
      }
    });
  }

  async _playRoulette(userAddress) {
    const rouletteInstance = await this.props.roulette.deployed();

    const number = random(1);
    const decNumber = format(number, 'dec');
    const hexNumber = format(number, 'hex');

    console.log('Numbers:');
    console.log({ decNumber, hexNumber });

    // STEP 1: Place Bet and set user hash
    console.log('About to place bet');
    this.setState({ step: 1 });
    await rouletteInstance.placeBet(
      this.state.color, sha(`0x${hexNumber}`),
      { from: userAddress, value: this.props.web3.toWei(this.state.betValue, 'ether') },
    );

    // STEP 2: Request server to set hash
    console.log('About to request server to set hash');
    this.setState({ step: 2 });
    const bankHash = await $.get(SET_BANK_HASH_ENDPOINT_URL, { userAddress });
    console.log({ bankHash });

    // STEP 3: Send own value
    console.log('About to send user value');
    this.setState({ step: 3 });
    await rouletteInstance.sendUserValue(decNumber, { from: userAddress });

    // STEP 4: Request server to send own value
    console.log('About to request server to send bank value');
    this.setState({ step: 4 });
    // TODO remove value
    const bankValue = await $.get(SEND_BANK_VALUE_ENDPOINT_URL, { bankHash, userAddress });
    console.log({ bankValue });

    // Wait for bank value...
    const bankValueSetEvent = rouletteInstance.BankValueWasSet({ userAddress });
    await waitForBankValueSet(rouletteInstance, bankValueSetEvent);
    bankValueSetEvent.stopWatching();

    // STEP 5: Request game evaluation
    console.log('About to evaluate bet');
    this.setState({ step: 5 });
    await rouletteInstance.evaluateBet({ from: userAddress });

    // TODO Remove DEBUG
    const bankAddress = '0x15ae150d7dC03d3B635EE90b85219dBFe071ED35';
    const registeredBankFunds = (await rouletteInstance.registeredFunds(bankAddress)).toNumber();
    const registeredUserFunds = (await rouletteInstance.registeredFunds(userAddress)).toNumber();
    console.log({ registeredBankFunds, registeredUserFunds });

    // STEP 6: get number of evaluation
    console.log('About to get evaluated number');
    this.setState({ step: 6 });
    const result = await rouletteInstance.lastRouletteNumbers(userAddress);
    console.log({ result });
    return result.toNumber();
  }
}

function waitForBankValueSet(rouletteInstance, bankValueSetEvent) {
  return new Promise((resolve, reject) => {
    bankValueSetEvent.watch((error, eventResult) => {
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

function sha(number) {
  return Web3Utils.sha3(number);
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

