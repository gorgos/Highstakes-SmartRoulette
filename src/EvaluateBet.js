import React from 'react';
import { connect } from 'react-redux';

class EvaluateBet extends React.Component {
  constructor(props) {
    super(props);
    this._onButtonClick = this._onButtonClick.bind(this);
  }

  render() {
    return (
      <div className="place-bet">
        <button onClick={ this._onButtonClick }>Place bet</button>
      </div>
    );
  }

  _onButtonClick() {
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => instance.getRouletteNumber(128, { from: accounts[0] }))
        .then(result => console.log(result));
    });
  }
}

const mapStateToProps = state => {
  return {
    roulette: state.roulette,
    web3: state.web3,
  };
}

export default connect(mapStateToProps)(EvaluateBet);
