import React from 'react';
import { connect } from 'react-redux';

const ROULETTE_NUMBER_ORDER = [26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32, 0];
const CIRCLE_DEGREE = 360;

class SendValues extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bankValue: '',
      userValue: '',
      wheelSpin: 0,
    };

    this._onInputChange = this._onInputChange.bind(this);
    this._onSendBankValueClick = this._onSendBankValueClick.bind(this);
    this._onSendUserValueClick = this._onSendUserValueClick.bind(this);
    this._onGetRouletteNumber = this._onGetRouletteNumber.bind(this);
    this._spinRouletteWheel = this._spinRouletteWheel.bind(this);
    this._onEvaluateClick = this._onEvaluateClick.bind(this);
  }

  render() {
    return (
      <div className="actions">
        <input
            type="text"
            value={ this.state.address }
            onChange={ e => this._onInputChange('bankValue', e) }
            placeholder="Bank value"
          />
        <button onClick={ this._onSendBankValueClick }>Send</button>
        <input
            type="text"
            value={ this.state.amount }
            onChange={ e => this._onInputChange('userValue', e) }
            placeholder="User value"
          />
        <button onClick={ this._onSendUserValueClick }>Send</button>
        <button onClick={ this._onGetRouletteNumber }>GetRouletteNumber</button>
        <button onClick={ this._onEvaluateClick }>Evaluate</button>
        <img
            width="1"
            height="1"
            src="http://upload.wikimedia.org/wikipedia/commons/7/7d/European_roulette_wheel.svg"
            alt="Roulette wheel"
            className="roulette-wheel"
            ref={ rouletteWheel => this._rouletteWheel = rouletteWheel }
          />
      </div>
    );
  }

  _onInputChange(key, e) {
    const state = {};
    state[key] = e.target.value;
    this.setState(state);
  }

  _onSendBankValueClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.sendBankValue(this.state.bankValue, { from: accounts[0] });
        }).then(result => console.log(result));
    });
  }

  _onSendUserValueClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.sendUserValue(this.state.userValue, { from: accounts[0] });
        }).then(result => console.log(result));
    });
  }

  _onGetRouletteNumber() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.getRouletteNumber(0, { from: accounts[0] });
        }).then(result => this._spinRouletteWheel(result.toNumber()));
    });
  }

  _spinRouletteWheel(number) {
    const previousTransformValue = this._rouletteWheel.style.getPropertyValue('transform');
    this._rouletteWheel.removeAttribute('style');

    const minRounds = 2;
    const maxRounds = 5;
    const rounds = Math.floor(Math.random() * maxRounds + minRounds);
    let deg = CIRCLE_DEGREE * rounds + degreeForNumber(number);

    if (`rotate(${deg}deg)` === previousTransformValue) {
      deg += CIRCLE_DEGREE;
    }

    this._rouletteWheel.setAttribute('style', `-webkit-transform: rotate(${deg}deg);`);
  }

  _onEvaluateClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.evaluateBet({ from: accounts[0] });
        }).then(result => console.log('result', result) /*this._spinRouletteWheel(result)*/);
    });
  }
}

function degreeForNumber(number) {
  const position = ROULETTE_NUMBER_ORDER.indexOf(number) + 1;
  return CIRCLE_DEGREE / ROULETTE_NUMBER_ORDER.length * position;
}

const mapStateToProps = state => {
  return {
    roulette: state.roulette,
    web3: state.web3,
  };
}

export default connect(mapStateToProps)(SendValues);
