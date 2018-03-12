import React from 'react';
import { connect } from 'react-redux';

class BankAndUserFunds extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bankFunds: '',
      userFunds: '',
      showOldState: {},
    };

    this._checkForExistingWeb3 = this._checkForExistingWeb3.bind(this);
    this._watchChangesInFunds = this._watchChangesInFunds.bind(this);
  }

  render() {
    return (
      <div className="user-funds">
        <div>
          <span>Bank Funds: </span>
          <span>{ this._stateToShow().bankFunds } ETH</span>
        </div>
        <div>
          <span>User Funds: </span>
          <span>{ this._stateToShow().userFunds } ETH</span>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this._checkForExistingWeb3();
  }

  _stateToShow() {
    if (this.state.showOldState.length > 0 && this.props.gameState === 'loading') {
      return this.state.showOldState;
    }

    return this.state;
  }

  _checkForExistingWeb3() {
    if (!this.props.web3) {
      setTimeout(this._checkForExistingWeb3, 1000);
    } else {
      this._updateFunds();
      this._watchChangesInFunds();
    }
  }

  _updateFunds() {
    this.props.web3.eth.getAccounts(async (error, accounts) => {
      const rouletteInstance = await this.props.roulette.deployed();
      const bankAddress = await rouletteInstance.bankAddress();
      const bankFunds = (await rouletteInstance.registeredFunds(bankAddress)).toNumber() / 10e17;
      const userFunds = (await rouletteInstance.registeredFunds(accounts[0])).toNumber() / 10e17;
      this.setState({ bankFunds, userFunds });
    });
  }

  _watchChangesInFunds() {
    this.props.web3.eth.getAccounts(async (error, accounts) => {
      const rouletteInstance = await this.props.roulette.deployed();
      const bankAddress = await rouletteInstance.bankAddress();
      const userAddress = accounts[0];
      const fundsChanged = rouletteInstance.FundsChanged({ address: [bankAddress, userAddress] });
      fundsChanged.watch(async (error, result) => {
        if (error) { console.log(error); }
        else {
          console.log({ result });
          const balance =  await rouletteInstance.registeredFunds(result.args._address);
          const state = {};
          const stateKey = result.args._address === bankAddress ? 'bankFunds' : 'userFunds';
          state[stateKey] = balance.toNumber() / 10e17;
          if (this.props.gameState !== 'loading') { this.setState(state); }
          else {
            this.setState(Object.assign(state, { showOldState: this.state }));
            const that = this;
            setTimeout(() => that.setState({ showOldState: {} }), 10500);
          }
        }
      });
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

export default connect(mapStateToProps)(BankAndUserFunds);
