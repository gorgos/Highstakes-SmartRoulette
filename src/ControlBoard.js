import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';

class ControlBoard extends React.Component {
  constructor(props) {
    super(props);

    this.state = { captchaResponse: '' };

    this._onBetValueChange = this._onBetValueChange.bind(this);
    this._onColorButtonClick = this._onColorButtonClick.bind(this);
  }

  render() {
    return (
      <div className="control">
        <div>
          <Slider
              min={ 0.1 }
              max={ 0.5 }
              step={ 0.1 }
              value={ this.props.betValue }
              onChange={ this._onBetValueChange }
            />
          <div
              className="button redbg"
              onClick={ () => this._onColorButtonClick(1) }
              style={{ border: `${this.props.color === 1 ? '3px solid white' : ''}`}}
            >
              Red
          </div>
          <div
              className="button greybg"
              onClick={ () => this._onColorButtonClick(0) }
              style={{ border: `${this.props.color === 0 ? '3px solid white' : ''}`}}
            >
            Black
          </div>
          <div
              className="button button-spin"
              onClick={ this.props.onButtonClick }
            >
            Spin
          </div>
          <b>{`Current bet amount: ${this.props.betValue} ETH`}</b>
          { this.props.warning &&
            <span><br /><b style={{ color: '#e7ff3f' }}>{ this.props.warning }</b></span>
          }
          { this.props.gameState === 'won' &&
            <span><br /><b style={{ color: '#e7ff3f' }}>Congratulations, you won! :)</b></span>
          }
          { this.props.gameState === 'lost' &&
            <span><br /><b style={{ color: '#e7ff3f' }}>Sorry, you lost. :(</b></span>
          }
        </div>
        <ReCAPTCHA
            className="google-captcha-custom"
            sitekey="6Lf69kwUAAAAAFQ-RapYCLD4h3mCAUQXCiw0rLP0"
            onChange={ captchaResponse => this.setState({ captchaResponse }) }
            theme="dark"
            size="normal"
            ref={ captcha => this._captcha = captcha }
          />
      </div>
    );
  }

  _onBetValueChange(value) {
    const betValue = Math.round(value * 100) / 100;
    this.props.setState({ betValue });
  }

  _onColorButtonClick(color) {
    if (this.props.gameState === 'loading') { return; }
    this.props.setState({ color });
  }
}

export default ControlBoard;
