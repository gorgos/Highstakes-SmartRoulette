import React from 'react';
import { connect } from 'react-redux';

class RetrieveWithdrawMoney extends React.Component {
  constructor(props) {
    super(props);

    this.state = { input: 0 };
    this._onInputChange = this._onInputChange.bind(this);
    this._onIncreaseClick = this._onIncreaseClick.bind(this);
    this._onWithdrawClick = this._onWithdrawClick.bind(this);
  }

  render() {
    return (
      <div>
        <input
            className="increase-money-input"
            type="number"
            onChange={ this._onInputChange }
            value={ this.state.input }
          />
        <div
            className="increase-money redbg"
            onClick={ this._onIncreaseClick }
          >
          Increase Funds
        </div>
        <div
            className="retrieve-money redbg"
            onClick={ this._onWithdrawClick }
          >
          Withdraw Funds
        </div>
      </div>
    );
  }

  _onInputChange(e) {
    this.setState({ input: e.target.value });
  }

  _onIncreaseClick() {
    if (this.props.gameState === 'loading') { return; }

    this.props.web3.eth.getAccounts(async (error, accounts) => {
      const rouletteInstance = await this.props.roulette.deployed();
      const increaseValue = this.props.web3.toWei(this.state.input, 'ether');
      await rouletteInstance.increaseFunds({ from: accounts[0], value: increaseValue });
    });
  }

  _onWithdrawClick() {
    if (this.props.gameState === 'loading') { return; }

    this.props.web3.eth.getAccounts(async (error, accounts) => {
      const rouletteInstance = await this.props.roulette.deployed();
      await rouletteInstance.retrieveMoney({ from: accounts[0] });
    });
  }
}

const mapStateToProps = state => {
  return {
    gameState: state.gameState,
    roulette: state.roulette,
    web3: state.web3,
  };
}

export default connect(mapStateToProps)(RetrieveWithdrawMoney);
