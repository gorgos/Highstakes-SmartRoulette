import React from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';
import { findDOMNode } from 'react-dom';

import './jquerykeyframe';

const ROULETTE_NUMBER_ORDER = [26,3,35,12,28,7,29,18,22,9,31,14,20,1,33,16,24,5,10,23,8,30,11
                                                            ,36,13,27,6,34,17,25,2,21,4,19,15,32,0];
const numred = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
const numblack = [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26];
const numgreen = [0];

class RouletteWheel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { color: -2, gameState: '' };
    this._numberLoc = [];
    this._onColorButtonClick = this._onColorButtonClick.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);
    this._spinWheel = this._spinWheel.bind(this);
    this._resetAni = this._resetAni.bind(this);
    this._bgrotateTo = this._bgrotateTo.bind(this);
    this._ballrotateTo = this._ballrotateTo.bind(this);
  }

  render() {
    return (
      <div className="place-bet">
        <div className="spinner">
          <div className="ball" ref={ ball => this._ball = ball }><span/></div>
          <div className="platebg"/>
          <div className="platetop"/>
          <div id="toppart" className="topnodebox" ref={ topart => this._topart = topart }>
            <div className="silvernode"/>
            <div className="topnode silverbg"/>
            <span className="top silverbg"/>
            <span className="right silverbg"/>
            <span className="down silverbg"/>
            <span className="left silverbg"/>
          </div>
          <div id="rcircle" className="pieContainer" ref={ circle => this._circle = circle }>
            <div className="pieBackground"/>
          </div>
        </div>
        <div className="control">
          <div>
            <div
                className="button redbg"
                onClick={ () => this._onColorButtonClick(0) }
                style={{ border: `${this.state.color === 0 ? '3px solid white' : ''}`}}
              >
                Red
            </div>
            <div
                className="button greybg"
                onClick={ () => this._onColorButtonClick(1) }
                style={{ border: `${this.state.color === 1 ? '3px solid white' : ''}`}}
              >
              Black
            </div>
            <div className="button button-spin" onClick={ this._onButtonClick }>Spin</div>
            { this.state.color === -1 &&
              <b style={{ color: 'white' }}>Please choose color</b>
            }
            { this.state.gameState === 'won' &&
              <b style={{ color: 'white' }}>Congratulations, you won!!!</b>
            }
            { this.state.gameState === 'lost' &&
              <b style={{ color: 'white' }}>Sorry, you lost. Please try again.</b>
            }
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this._createWheel();
  }

  _onColorButtonClick(color) {
    this.setState({ color: color });
  }

  _spinWheel(num) {
    this._resetAni();
    const that = this;

    let gameState = 'lost';
    const isRed = numred.indexOf(num) !== -1;
    const isBlack = numblack.indexOf(num) !== -1;

    if ((isRed && this.state.color === 0) || (isBlack && this.state.color === 1)) {
      gameState = 'won';
    }

    const temp = this._numberLoc[num][0] + 4;
    const rndSpace = Math.floor(Math.random() * 360 + 1);

    setTimeout(function() {
      that._bgrotateTo(rndSpace);
      that._ballrotateTo(rndSpace + temp);
    }, 500);
    setTimeout(function() {
      that.setState({ gameState: gameState });
    }, 8750);
  }

  _resetAni() {
    $(findDOMNode(this._ball))
      .css("animation-play-state", "running")
      .css("animation", "none");

    $(findDOMNode(this._circle))
      .css("animation-play-state", "running")
      .css("animation", "none");
    $(findDOMNode(this._topart))
      .css("animation-play-state", "running")
      .css("animation", "none");

    $("#rotate2").html("");
    $("#rotate").html("");
  }

  _bgrotateTo(deg) {
    const rotationsTime = 8;
    const wheelSpinTime = 6;
    const dest = 360 * wheelSpinTime + deg;
    const temptime = (rotationsTime * 1000 - 1000) / 1000 + 's';

    $.keyframe.define({
      name: "rotate",
      from: {
        transform: "rotate(0deg)"
      },
      to: {
        transform: "rotate(" + dest + "deg)"
      }
    });

    $(findDOMNode(this._circle)).playKeyframe({
      name: "rotate",
      duration: temptime,
      timingFunction: "ease-in-out",
    });

    $(findDOMNode(this._topart)).playKeyframe({
      name: "rotate",
      duration: temptime,
      timingFunction: "ease-in-out"
    });
  }

  _ballrotateTo(deg) {
    const rotationsTime = 8;
    const ballSpinTime = 5;
    const temptime = rotationsTime + 's';
    const dest = -360 * ballSpinTime - (360 - deg);
    $.keyframe.define({
      name: "rotate2",
      from: {
        transform: "rotate(0deg)"
      },
      to: {
        transform: "rotate(" + dest + "deg)"
      }
    });

    $(findDOMNode(this._ball)).playKeyframe({
      name: "rotate2",
      duration: temptime,
      timingFunction: "ease-in-out",
    });
  }

  _createWheel() {
    const temparc = 360 / ROULETTE_NUMBER_ORDER.length;
    for (var i = 0; i < ROULETTE_NUMBER_ORDER.length; i++) {
      this._numberLoc[ROULETTE_NUMBER_ORDER[i]] = [];
      this._numberLoc[ROULETTE_NUMBER_ORDER[i]][0] = i * temparc;
      this._numberLoc[ROULETTE_NUMBER_ORDER[i]][1] = i * temparc + temparc;

      let newSlice, newHold, newNumber;

      newSlice = document.createElement("div");
      $(newSlice).addClass("hold");
      newHold = document.createElement("div");
      $(newHold).addClass("pie");
      newNumber = document.createElement("div");
      $(newNumber).addClass("num");

      newNumber.innerHTML = ROULETTE_NUMBER_ORDER[i];
      $(newSlice).attr("id", "rSlice" + i);
      $(newSlice).css(
        "transform",
        "rotate(" + this._numberLoc[ROULETTE_NUMBER_ORDER[i]][0] + "deg)"
      );

      $(newHold).css("transform", "rotate(9.73deg)");
      $(newHold).css("-webkit-transform", "rotate(9.73deg)");

      if ($.inArray(ROULETTE_NUMBER_ORDER[i], numgreen) > -1) {
        $(newHold).addClass("greenbg");
      } else if ($.inArray(ROULETTE_NUMBER_ORDER[i], numred) > -1) {
        $(newHold).addClass("redbg");
      } else if ($.inArray(ROULETTE_NUMBER_ORDER[i], numblack) > -1) {
        $(newHold).addClass("greybg");
      }

      $(newNumber).appendTo(newSlice);
      $(newHold).appendTo(newSlice);
      $(newSlice).appendTo(findDOMNode(this._circle));
    }
  }

  _onButtonClick() {
    if (this.state.color === -2 || this.state.color === -1) {
      this.setState({ color: -1 });
      return;
    }
    this.setState({ gameState: '' });
    const rand = Math.floor(Math.random() * 255);
    this.props.web3.eth.getAccounts((error, accounts) => {
      this.props.roulette.deployed()
        .then(instance => instance.getRouletteNumber(rand, { from: accounts[0] }))
        .then(result => this._spinWheel(result.toNumber()));
    });
  }
}

const mapStateToProps = state => {
  return {
    roulette: state.roulette,
    web3: state.web3,
  };
}

export default connect(mapStateToProps)(RouletteWheel);

