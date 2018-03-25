import React from 'react';
import { ReactSpinner } from 'react-spinning-wheel';
import 'react-spinning-wheel/dist/style.css';

function StepOverview({ step, skipBankHashWait, skipGameEvaluation, gameState }) {
  return (
    <div className="step-overview">
      <ul className="step-list" style={{ display: step === 0 ? 'none' : '' }}>
        { step > 0 && <li>STEP 1: Request bank to commit hash</li> }
        { step > 1 &&
          <li>
            <b style={{ color: '#e7ff3f' }}>{ skipBankHashWait ? 'Skipping ' : '' }</b>
            STEP 2: Wait for contract to receive hash
          </li>
        }
        { step > 2 && <li>STEP 3: Place bet and set user value</li> }
        { step > 3 && <li>STEP 4: Request bank to send own value</li> }
        { step > 4 &&
          <li>
            <b style={{ color: '#e7ff3f' }}>{ skipGameEvaluation ? 'Skipping ' : '' }</b>
            STEP 5: Wait for game evaluation
          </li>
        }
        { step > 5 && <li>STEP 6: Get Roulette number.. good luck!</li> }
      </ul>
      { gameState === 'loading' && <ReactSpinner/> }
    </div>
  );
}

export default StepOverview;
