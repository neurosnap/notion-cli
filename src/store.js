import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware, { END } from 'redux-saga';
import Freeze from 'redux-freeze';

import { exception } from 'notion-modules/logging';

import rootReducer from 'notion-app/reducers';
import rootSaga from 'notion-app/sagas';

export default function configureStore({ screen, initialState = {} } = {}) {
  const onError = (err) => {
    if (screen) screen.log(err);
  };
  const sagaMiddleware = createSagaMiddleware({ onError });
  const enhancer = compose(applyMiddleware(sagaMiddleware, Freeze));
  const store = createStore(rootReducer, initialState, enhancer);

  store.close = () => store.dispatch(END);
  sagaMiddleware.run(rootSaga);
  return store;
}
