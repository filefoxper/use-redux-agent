import {createStore} from "redux";
import User from './user';
import {createReduxAgentReducer, legacy} from "use-redux-agent";
import CountLegacy from "@/module/countLegacy";

const legacyModules=legacy({
    count:CountLegacy
});

const modules={
    ...legacyModules,
    User
}

const reducer = createReduxAgentReducer(modules);

const store = createStore(reducer, reducer.enhancer);

export default store;