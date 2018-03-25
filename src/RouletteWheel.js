import React from 'react';
import $ from 'jquery';
import { findDOMNode } from 'react-dom';
import './vendor/jquerykeyframe';

const ROULETTE_NUMBER_ORDER = [26,3,35,12,28,7,29,18,22,9,31,14,20,1,33,16,24,5,10,23,8,30,11
                                                            ,36,13,27,6,34,17,25,2,21,4,19,15,32,0];
const RED_NUMBERS = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
const BLACK_NUMBERS = [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26];
const GREEN_NUMBERS = [0];

class RouletteWheel extends React.Component {
  constructor(props) {
    super(props);
    this._numberLoc = [];
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
      </div>
    );
  }

  componentDidMount() {
    this._createWheel();
  }

  _spinWheel(num, color) {
    this._resetAni();
    const that = this;

    let gameState = 'lost';
    const isRed = RED_NUMBERS.indexOf(num) !== -1;
    const isBlack = BLACK_NUMBERS.indexOf(num) !== -1;

    if ((isRed && color === 1) || (isBlack && color === 0)) {
      gameState = 'won';
    }

    const temp = this._numberLoc[num][0] + 4;
    const rndSpace = Math.floor(Math.random() * 360 + 1);

    setTimeout(() => {
      that._bgrotateTo(rndSpace);
      that._ballrotateTo(rndSpace + temp);
    }, 500);

    return gameState;
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

      if ($.inArray(ROULETTE_NUMBER_ORDER[i], GREEN_NUMBERS) > -1) {
        $(newHold).addClass("greenbg");
      } else if ($.inArray(ROULETTE_NUMBER_ORDER[i], RED_NUMBERS) > -1) {
        $(newHold).addClass("redbg");
      } else if ($.inArray(ROULETTE_NUMBER_ORDER[i], BLACK_NUMBERS) > -1) {
        $(newHold).addClass("greybg");
      }

      $(newNumber).appendTo(newSlice);
      $(newHold).appendTo(newSlice);
      $(newSlice).appendTo(findDOMNode(this._circle));
    }
  }
}
export default RouletteWheel;

