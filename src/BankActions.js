import React from 'react';
import { connect } from 'react-redux';

class BankActions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      address: '',
      bankHash: '',
      amount: '',
    };

    this._onInputChange = this._onInputChange.bind(this);
    this._onShowFundClick = this._onShowFundClick.bind(this);
    this._onSetBankHashClick = this._onSetBankHashClick.bind(this);
    this._onIncreaseBankFundsClick = this._onIncreaseBankFundsClick.bind(this);
  }

  render() {
    return (
      <div className="actions">
        <div className="utils">
          <input
              type="text"
              value={ this.state.address }
              onChange={ e => this._onInputChange('address', e) }
              placeholder="Address"
            />
          <button onClick={ this._onShowFundClick }>Show funds</button>
          <input
              type="text"
              value={ this.state.amount }
              onChange={ e => this._onInputChange('amount', e) }
              placeholder="Amount"
            />
          <button onClick={ this._onIncreaseBankFundsClick }>Inc bank funds</button>
          </div>
          <div className="bankUtils">
            <input
                type="text"
                value={ this.state.bankHash }
                onChange={ e => this._onInputChange('bankHash', e) }
                placeholder="Bank hash"
              />
            <button onClick={ this._onSetBankHashClick }>Set bank hash</button>
          </div>
      </div>
    );
  }

  _onInputChange(key, e) {
    const state = {};
    state[key] = e.target.value;
    this.setState(state);
  }

  _onShowFundClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          instance.showBalance(this.state.address, { from: accounts[0] });
        }).then(result => console.log(result));
    });
  }

  _onSetBankHashClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          instance.setBankHash(this.state.bankHash, { from: accounts[0] });
        }).then(result => console.log(result));
    });
  }

  _onIncreaseBankFundsClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          instance.getRouletteNumber(10, { from: accounts[0], value: parseInt(this.state.amount, 10) });
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

export default connect(mapStateToProps)(BankActions);
