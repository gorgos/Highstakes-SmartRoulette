import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { Provider } from 'react-redux';
import { createStore } from 'redux';
import reducer from './reducer';

ReactDOM.render(
  <Provider store={ createStore(reducer) }>
    <App />
  </Provider>,
  document.getElementById('root'),
);

// middleware not working with MetaMask :(
// window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
