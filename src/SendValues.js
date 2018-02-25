import React from 'react';
import { connect } from 'react-redux';

class SendValues extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bankValue: '',
      userValue: '',
    };

    this._onInputChange = this._onInputChange.bind(this);
    this._onSendBankValueClick = this._onSendBankValueClick.bind(this);
    this._onSendUserValueClick = this._onSendUserValueClick.bind(this);
    this._onGetRouletteNumber = this._onGetRouletteNumber.bind(this);
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
          return instance.getRouletteNumber(230, { from: accounts[0] });
        }).then(result => console.log(result.toNumber()));
    });
  }

  _onEvaluateClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.evaluateBet({ from: accounts[0] });
        }).then(result => console.log(result));
    });
  }
}

const mapStateToProps = state => {
  return {
    roulette: state.roulette,
    web3: state.web3,
  };
}

export default connect(mapStateToProps)(SendValues);
