import React from 'react';
import { connect } from 'react-redux';

class BankActions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      address: '',
      bankHash: '',
      amount: '',
      showFundsAddress: '',
    };

    this._onInputChange = this._onInputChange.bind(this);
    this._onRetrieveFundsClick = this._onRetrieveFundsClick.bind(this);
    this._onEvaluateBet = this._onEvaluateBet.bind(this);
    this._onIncreaseBankFundsClick = this._onIncreaseBankFundsClick.bind(this);
    this._onShowFundsClick = this._onShowFundsClick.bind(this);
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
          <button onClick={ this._onRetrieveFundsClick }>Retrieve funds</button>
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
            <button onClick={ this._onEvaluateBet }>Evaluate Bet</button>
            <input
                type="text"
                value={ this.state.showFundsAddress }
                onChange={ e => this._onInputChange('showFundsAddress', e) }
                placeholder="Address"
              />
            <button onClick={ this._onShowFundsClick }>Show funds</button>
          </div>
      </div>
    );
  }

  _onInputChange(key, e) {
    const state = {};
    state[key] = e.target.value;
    this.setState(state);
  }

  _onRetrieveFundsClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return  instance.retrieveMoney(this.state.address, { from: accounts[0] });
        }).then(result => console.log(result));
    });
  }

  _onEvaluateBet() {
    this.props.web3.eth.getAccounts(async (error, accounts) => {
      const rouletteInstance = await this.props.roulette.deployed();
      const result =  await rouletteInstance.evaluateBet({ from: accounts[0] });
      console.log({ result });
    });
  }

  _onIncreaseBankFundsClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.increaseBankFunds({
            from: accounts[0],
            value: parseInt(this.state.amount * 10e17, 10),
          });
        }).then(result => console.log(result));
    });
  }

  _onShowFundsClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => {
          return instance.showBalance(this.state.showFundsAddress, { from: accounts[0] });
        }).then(result => console.log(result.toNumber()));
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
