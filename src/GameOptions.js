import React from 'react';

function GameOptions({ onSkipBankHashWaitChange, onSkipGameEvaluationWait }) {
  return (
    <div className="game-options">
      <div>
        <input
            id="skipBankHashWait"
            type="checkbox"
            onChange={ onSkipBankHashWaitChange }
          />
        <label htmlFor="skipBankHashWait">{' '}Skip waiting for bank hash?</label>
      </div>
      <div>
        <input
            id="skipGameEvaluationWait"
            type="checkbox"
            onChange={ onSkipGameEvaluationWait }
          />
        <label htmlFor="skipGameEvaluationWait">{' '}Pre-calculate and show game result?</label>
      </div>
    </div>
  );
}

export default GameOptions;
