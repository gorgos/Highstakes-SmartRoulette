import React from 'react';
import getWeb3 from './utils/getWeb3';
import { connect } from 'react-redux';

import BankAndUserFunds from './BankAndUserFunds';
import RetrieveWithdrawMoney from './RetrieveWithdrawMoney';
import RouletteGame from './RouletteGame';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './css/roulette-wheel.css';
import './css/App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { incorrectNetwork: false };
  }
  componentWillMount() {
    getWeb3.then(results => {
      this.props.storeWeb3(results.web3);
      results.web3.version.getNetwork((error, result) => {
        this.setState({ incorrectNetwork: (error || result !== '4') });
      });
      this._storeRouletteContract();
    }).catch(error => console.log(error));
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
              { this._showRouletteUI() && <BankAndUserFunds /> }
              { this._showRouletteUI() && <RetrieveWithdrawMoney /> }
              { this._showRouletteUI() && <RouletteGame /> }
              { !this.props.web3 && <NoMetaMask /> }
              { this.state.incorrectNetwork && <IncorrectNetwork /> }
            </div>
          </div>
        </main>
      </div>
    );
  }

  _showRouletteUI() {
    return this.props.web3 && !this.state.incorrectNetwork;
  }

  _storeRouletteContract() {
    const contract = require('truffle-contract');
    const roulette = require("../build/contracts/roulette.json");
    const rouletteFactory = contract(roulette);
    rouletteFactory.setProvider(this.props.web3.currentProvider);
    this.props.storeRouletteContract(rouletteFactory);
  }
}

function NoMetaMask() {
  return (
    <ErrorComponent>
      Please install{' '}
        <a
            className="no-metamask-link"
            href="https://metamask.io/"
          >
          MetaMask
        </a>
        {' '}Extension!
    </ErrorComponent>
  );
}

function IncorrectNetwork() {
  return (
    <ErrorComponent>
      Please change to Rinkeby test network!
    </ErrorComponent>
  );
}

function ErrorComponent(props) {
  return (
    <div className="container4">
      <p className="no-metamask">
        { props.children }
      </p>
    </div>
  );
}

const mapStateToProps = state => {
  return {
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
