export default function reducer(state = { roulette: null }, action) {
  switch(action.type) {
    case "STORE_GAME_STATE": return { ...state, gameState: action.payload };
    case "STORE_ROULETTE_CONTRACT": return { ...state, roulette: action.payload };
    case "STORE_WEB3": return { ...state, web3: action.payload };

    default: return state;
  }
}
