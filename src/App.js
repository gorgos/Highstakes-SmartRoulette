import React from 'react';
import getWeb3 from './utils/getWeb3';
import { connect } from 'react-redux';

import BankAndUserFunds from './BankAndUserFunds';
import RouletteGame from './RouletteGame';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './css/roulette-wheel.css';
import './App.css';

class App extends React.Component {
  componentWillMount() {
    getWeb3.then(results => {
      this.props.storeWeb3(results.web3);
      this._storeRouletteContract();
    }).catch(() => console.log('Error finding web3.'));
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Roulette</a>
        </nav>

        <main className="rouletteContainer">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h2>Roulette Contract</h2>
              <BankAndUserFunds />
              <RouletteGame />
            </div>
          </div>
        </main>
      </div>
    );
  }

  _storeRouletteContract() {
    const contract = require('truffle-contract');
    const roulette = require("../build/contracts/roulette.json");
    const rouletteFactory = contract(roulette);
    rouletteFactory.setProvider(this.props.web3.currentProvider);
    this.props.storeRouletteContract(rouletteFactory);
  }
}

const mapStateToProps = state => {
  return {
    roulette: state.roulette,
    web3: state.web3,
  };
}

const mapDispatchToProps = dispatch => {
  return {
    storeRouletteContract : contract => dispatch({
      type : 'STORE_ROULETTE_CONTRACT',
      payload: contract,
    }),
    storeWeb3 : web3 => dispatch({
      type : 'STORE_WEB3',
      payload: web3,
    })
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
