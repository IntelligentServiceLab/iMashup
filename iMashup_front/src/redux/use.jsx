import {
    increment
  } from "./redux/reducer";
  import { store } from './redux/store.ts';
  import { Provider, useDispatch, useSelector } from 'react-redux';
  
  const count = useSelector(state => state.counter.value);
  const dispatch = useDispatch();
  dispatch((increment()));
  <Provider store={store}></Provider>