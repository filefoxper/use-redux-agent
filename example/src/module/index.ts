import {createStore} from "redux";
import User from './user';
import {createReduxAgentReducer} from "use-redux-agent";

const reducer = createReduxAgentReducer({User});

const store = createStore(reducer, reducer.enhancer);

export default store;