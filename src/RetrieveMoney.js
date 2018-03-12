import React from 'react';
import { connect } from 'react-redux';

class RetrieveMoney extends React.Component {
  constructor(props) {
    super(props);
    this._onButtonClick = this._onButtonClick.bind(this);
  }

  render() {
    return (
      <div
          className="retrieve-money redbg"
          onClick={ this._onButtonClick }
        >
        Retrieve Money
      </div>
    );
  }

  _onButtonClick() {
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

export default connect(mapStateToProps)(RetrieveMoney);
