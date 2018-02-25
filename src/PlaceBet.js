import React from 'react';
import { connect } from 'react-redux';

class PlaceBet extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      betGuessInput: '',
      betAmountInput: '',
      userInput: '',
      hashInput: '',
    };

    this._onInputChange = this._onInputChange.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
  }

  render() {
    return (
      <div className="place-bet">
        <input
            type="text"
            value={ this.state.betGuessInput }
            onChange={ e => this._onInputChange('betGuessInput', e) }
            placeholder="Guess (0 or 1)"
          />
        <input
            type="text"
            value={ this.state.betAmountInput }
            onChange={ e => this._onInputChange('betAmountInput', e) }
            placeholder="Bet amount"
          />
        <input
            type="text"
            value={ this.state.userInput }
            onChange={ e => this._onInputChange('userInput', e) }
            placeholder="Address"
          />
        <input
            type="text"
            value={ this.state.hashInput }
            onChange={ e => this._onInputChange('hashInput', e) }
            placeholder="Hash of secret value"
          />
        <button onClick={ this._onButtonClick }>Place bet</button>
      </div>
    );
  }

  _onInputChange(key, e) {
    const state = {};
    state[key] = e.target.value;
    this.setState(state);
  }

  _onButtonClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => instance.placeBet(
            this.state.betGuessInput,
            this.state.userInput,
            this.state.hashInput,
            {
              from: accounts[0],
              value: parseInt(this.state.betAmountInput*1000000000000000000, 10),
            },
        )).then(result => console.log(result));
    });
  }
}

const mapStateToProps = state => {
  return {
    roulette: state.roulette,
    web3: state.web3,
  };
}

export default connect(mapStateToProps)(PlaceBet);
