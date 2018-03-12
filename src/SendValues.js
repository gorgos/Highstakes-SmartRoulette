import React from 'react';
import { connect } from 'react-redux';

class SendValues extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bankFunds: '',
      userFunds: '',
    };

    this._refreshFunds = this._refreshFunds.bind(this);
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
    const that = this;
    window.setInterval(() => that._refreshFunds(), 5000);
  }

  _refreshFunds() {
    this.props.web3.eth.getAccounts(async (error, accounts) => {
      const rouletteInstance = await this.props.roulette.deployed();
      const result =  await rouletteInstance.getUserAndBankBalance({ from: accounts[0] });
      this.setState({
        userFunds: result[0].toNumber() / 10e17,
        bankFunds: result[1].toNumber() / 10e17,
      });
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
