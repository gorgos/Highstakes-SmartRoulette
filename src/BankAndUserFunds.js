import React from 'react';
import { connect } from 'react-redux';

class BankAndUserFunds extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bankFunds: '',
      userFunds: '',
      newState: {},
    };

    this._checkForExistingWeb3 = this._checkForExistingWeb3.bind(this);
    this._watchChangesInFunds = this._watchChangesInFunds.bind(this);
  }

  render() {
    return (
      <div className="user-funds">
        <div>
          <span>Bank Funds: </span>
          <span>{ this.state.bankFunds } ETH</span>
        </div>
        <div>
          <span>User Funds: </span>
          <span>{ this.state.userFunds } ETH</span>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this._checkForExistingWeb3();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.gameState === 'loading' && nextProps.gameState !== 'loading') {
      this.setState(this.state.newState);
    }
  }

  _isNewStateEmpty() {
    return (Object.keys(this.state.newState).length === 0);
  }

  _checkForExistingWeb3() {
    // should probably go into componentWillReceiveProps
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
        if (error) { console.log({ error }); }
        else {
          const balanceResult =  await rouletteInstance.registeredFunds(result.args._address);
          const state = {};
          const stateKey = result.args._address === bankAddress ? 'bankFunds' : 'userFunds';
          const balance = balanceResult.toNumber() / 10e17;
          state[stateKey] = balance;

          if (this.props.gameState !== 'loading' || balance <= this.state[stateKey]) {
            // game is not loading OR it was only the first update event -> update funds
            this.setState(state);
          } else {
            state.newState = {};
            this.setState(Object.assign({ newState: state }));
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
