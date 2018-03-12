import React from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';
import { findDOMNode } from 'react-dom';
import Web3Utils from 'web3-utils';
import format from 'biguint-format';
import crypto from 'crypto';

import { ReactSpinner } from 'react-spinning-wheel';
import 'react-spinning-wheel/dist/style.css';

require('babel-polyfill');

import './jquerykeyframe';

const ROULETTE_NUMBER_ORDER = [26,3,35,12,28,7,29,18,22,9,31,14,20,1,33,16,24,5,10,23,8,30,11
                                                            ,36,13,27,6,34,17,25,2,21,4,19,15,32,0];
const numred = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
const numblack = [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26];
const numgreen = [0];

const AWS_ENDPOINT_URL = 'https://kxeix65tni.execute-api.us-east-1.amazonaws.com/dev/';
const SET_BANK_HASH_ENDPOINT_URL = AWS_ENDPOINT_URL + 'set';
const SEND_BANK_VALUE_ENDPOINT_URL = AWS_ENDPOINT_URL + 'send';

class RouletteWheel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { gameState: '', chooseColorHint: false };
    this._numberLoc = [];
    this._onColorButtonClick = this._onColorButtonClick.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
    this._spinWheel = this._spinWheel.bind(this);
    this._resetAni = this._resetAni.bind(this);
    this._bgrotateTo = this._bgrotateTo.bind(this);
    this._ballrotateTo = this._ballrotateTo.bind(this);
    this.setState = this.setState.bind(this);
  }

  render() {
    return (
      <div>
        <div className="place-bet">
          <div className="spinner">
            <div className="ball" ref={ ball => this._ball = ball }><span/></div>
            <div className="platebg"/>
            <div className="platetop"/>
            <div id="toppart" className="topnodebox" ref={ topart => this._topart = topart }>
              <div className="silvernode"/>
              <div className="topnode silverbg"/>
              <span className="top silverbg"/>
              <span className="right silverbg"/>
              <span className="down silverbg"/>
              <span className="left silverbg"/>
            </div>
            <div id="rcircle" className="pieContainer" ref={ circle => this._circle = circle }>
              <div className="pieBackground"/>
            </div>
          </div>
        </div>
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
            <div className="button button-spin" onClick={ this._onButtonClick }>Spin</div>
            { this.state.gameState === 'loading' && <ReactSpinner/> }
            { this.state.chooseColorHint &&
              <b style={{ color: 'white' }}>Please choose color</b>
            }
            { this.state.gameState === 'won' &&
              <b style={{ color: 'white' }}>Congratulations, you won!!!</b>
            }
            { this.state.gameState === 'lost' &&
              <b style={{ color: 'white' }}>Sorry, you lost. Please try again.</b>
            }
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this._createWheel();
  }

  _onColorButtonClick(color) {
    this.setState({ color: color });
  }

  _spinWheel(num) {
    this._resetAni();
    const that = this;

    let gameState = 'lost';
    const isRed = numred.indexOf(num) !== -1;
    const isBlack = numblack.indexOf(num) !== -1;

    if ((isRed && this.state.color === 1) || (isBlack && this.state.color === 0)) {
      gameState = 'won';
    }

    const temp = this._numberLoc[num][0] + 4;
    const rndSpace = Math.floor(Math.random() * 360 + 1);

    setTimeout(function() {
      that._bgrotateTo(rndSpace);
      that._ballrotateTo(rndSpace + temp);
    }, 500);
    setTimeout(function() {
      that.setState({ gameState: gameState });
    }, 8750);
  }

  _resetAni() {
    $(findDOMNode(this._ball))
      .css("animation-play-state", "running")
      .css("animation", "none");

    $(findDOMNode(this._circle))
      .css("animation-play-state", "running")
      .css("animation", "none");
    $(findDOMNode(this._topart))
      .css("animation-play-state", "running")
      .css("animation", "none");

    $("#rotate2").html("");
    $("#rotate").html("");
  }

  _bgrotateTo(deg) {
    const rotationsTime = 8;
    const wheelSpinTime = 6;
    const dest = 360 * wheelSpinTime + deg;
    const temptime = (rotationsTime * 1000 - 1000) / 1000 + 's';

    $.keyframe.define({
      name: "rotate",
      from: {
        transform: "rotate(0deg)"
      },
      to: {
        transform: "rotate(" + dest + "deg)"
      }
    });

    $(findDOMNode(this._circle)).playKeyframe({
      name: "rotate",
      duration: temptime,
      timingFunction: "ease-in-out",
    });

    $(findDOMNode(this._topart)).playKeyframe({
      name: "rotate",
      duration: temptime,
      timingFunction: "ease-in-out"
    });
  }

  _ballrotateTo(deg) {
    const rotationsTime = 8;
    const ballSpinTime = 5;
    const temptime = rotationsTime + 's';
    const dest = -360 * ballSpinTime - (360 - deg);
    $.keyframe.define({
      name: "rotate2",
      from: {
        transform: "rotate(0deg)"
      },
      to: {
        transform: "rotate(" + dest + "deg)"
      }
    });

    $(findDOMNode(this._ball)).playKeyframe({
      name: "rotate2",
      duration: temptime,
      timingFunction: "ease-in-out",
    });
  }

  _createWheel() {
    const temparc = 360 / ROULETTE_NUMBER_ORDER.length;
    for (var i = 0; i < ROULETTE_NUMBER_ORDER.length; i++) {
      this._numberLoc[ROULETTE_NUMBER_ORDER[i]] = [];
      this._numberLoc[ROULETTE_NUMBER_ORDER[i]][0] = i * temparc;
      this._numberLoc[ROULETTE_NUMBER_ORDER[i]][1] = i * temparc + temparc;

      let newSlice, newHold, newNumber;

      newSlice = document.createElement("div");
      $(newSlice).addClass("hold");
      newHold = document.createElement("div");
      $(newHold).addClass("pie");
      newNumber = document.createElement("div");
      $(newNumber).addClass("num");

      newNumber.innerHTML = ROULETTE_NUMBER_ORDER[i];
      $(newSlice).attr("id", "rSlice" + i);
      $(newSlice).css(
        "transform",
        "rotate(" + this._numberLoc[ROULETTE_NUMBER_ORDER[i]][0] + "deg)"
      );

      $(newHold).css("transform", "rotate(9.73deg)");
      $(newHold).css("-webkit-transform", "rotate(9.73deg)");

      if ($.inArray(ROULETTE_NUMBER_ORDER[i], numgreen) > -1) {
        $(newHold).addClass("greenbg");
      } else if ($.inArray(ROULETTE_NUMBER_ORDER[i], numred) > -1) {
        $(newHold).addClass("redbg");
      } else if ($.inArray(ROULETTE_NUMBER_ORDER[i], numblack) > -1) {
        $(newHold).addClass("greybg");
      }

      $(newNumber).appendTo(newSlice);
      $(newHold).appendTo(newSlice);
      $(newSlice).appendTo(findDOMNode(this._circle));
    }
  }

  _onButtonClick() {
    if (this.state.color === undefined) {
      this.setState({ chooseColorHint: true });
      return;
    }
    this.setState({ gameState: 'loading', chooseColorHint: false });

    this.props.web3.eth.getAccounts(async (error, accounts) => {
      try {
        const number = await playRoulette(this.setState, accounts[0], this.props.roulette, this.state.color);
        this._spinWheel(number);
      } catch (e) {
        console.log({ e });
      }
    });
  }
}

async function playRoulette(setState, userAddress, roulette, userBet) {
  const rouletteInstance = await roulette.deployed();

  const number = random(1);
  const decNumber = format(number, 'dec');
  const hexNumber = format(number, 'hex');

  console.log('Numbers:');
  console.log({ number });
  console.log({ decNumber, hexNumber });

  // STEP 1: Place Bet and set user hash
  console.log('About to place bet');
  setState({ step: 1 });
  await rouletteInstance.placeBet(
    userBet, sha(`0x${hexNumber}`),
    { from: userAddress, value: 10e16 }, // TODO Bet value (currently 0.1ETH)
  );

  // STEP 2: Request server to set hash
  console.log('About to request server to set hash');
  setState({ step: 2 });
  const bankHash = await $.get(SET_BANK_HASH_ENDPOINT_URL, { userAddress });
  console.log({ bankHash });

  // OPTIONAL: Check if bank hash is set

  // STEP 3: Send own value
  console.log('About to send user value');
  setState({ step: 3 });
  await rouletteInstance.sendUserValue(decNumber, { from: userAddress });

  // STEP 4: Request server to send own value
  console.log('About to request server to send bank value');
  setState({ step: 4 });
  // TODO remove value
  const bankValue = await $.get(SEND_BANK_VALUE_ENDPOINT_URL, { bankHash, userAddress });
  console.log({ bankValue });

  // STEP 5: Request game evaluation
  console.log('About to evaluate bet');
  setState({ step: 5 });
  await rouletteInstance.evaluateBet({ from: userAddress });

  // TODO DEBUG
  const bankAddress = '0x15ae150d7dC03d3B635EE90b85219dBFe071ED35';
  const registeredBankFunds = (await rouletteInstance.registeredFunds(bankAddress)).toNumber();
  const registeredUserFunds = (await rouletteInstance.registeredFunds(userAddress)).toNumber();
  console.log({ registeredBankFunds, registeredUserFunds });

  // STEP 6: get number of evaluation
  console.log('About to get evaluated number');
  setState({ step: 6 });
  const result = await rouletteInstance.lastRouletteNumbers(userAddress);
  console.log({ result });
  return result.toNumber();
}

const mapStateToProps = state => {
  return {
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

export default connect(mapStateToProps)(RouletteWheel);

