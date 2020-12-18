import {OriginAgent, createAgentReducer, AgentReducer, Action, Reducer, getAgentNamespaceKey} from "agent-reducer";
import {
    AgentClass,
    ReduxModule,
    StoreMap,
    AgentReducerMapGetter,
    AgentReducerMap,
    Enhancer,
    ObjectMapValuesCallback
} from "./redux.type";
import {Store, StoreCreator} from "redux";

let storeMap: StoreMap = new Map();

const mapObjectValues = <S extends object>(source: S, callback: ObjectMapValuesCallback<S>): { [key in keyof S]: any } => {
    let target: any = Object.create(Object.getPrototypeOf(source));
    for (const key in source) {
        if (!source.hasOwnProperty(key)) {
            continue;
        }
        const value = source[key];
        target[key] = callback(value, key);
    }
    return target;
};

export function createReduxAgentReducer(dxModule: ReduxModule): Reducer<any, Action> & { enhancer: Enhancer } {

    function combineReducers(reducers: Array<AgentReducer>): Reducer<any, Action> & { enhancer?: Enhancer } {
        const initialState = mapObjectValues(reducers, (reducer: AgentReducer) => reducer.initialState);
        return function (state = initialState, action: Action) {
            return reducers.reduce((nextStates, reducer) => {
                const namespace = reducer.namespace;
                const next = reducer(namespace ? state[namespace] : state, action);
                return namespace ? {...nextStates, [namespace]: next} : next;
            }, {});
        }
    }

    function toReducer(dxReducer: OriginAgent,useLegacy?:boolean): AgentReducer {
        return createAgentReducer(dxReducer, {expired: true, updateBy: 'manual',legacy:!!useLegacy});
    }

    let agentReducerMap: AgentReducerMap = new Map();
    let reducers: Array<AgentReducer> = [];
    for (const [key, ReducerClass] of Object.entries(dxModule)) {
        const dxReducer = new ReducerClass();
        dxReducer[getAgentNamespaceKey()] = key;
        const reducer = toReducer(dxReducer,(ReducerClass as { new(): OriginAgent }&{useLegacy?:boolean}).useLegacy);
        reducers.push(reducer);
        agentReducerMap.set(ReducerClass, reducer);
    }

    function getClassReducer(reducerClass: AgentClass) {
        const transition = agentReducerMap.get(reducerClass);
        if (!transition) {
            throw new Error('please use createReduxEnv to create a reducer first.')
        }
        return transition;
    }

    function enhancer(createStore: StoreCreator) {
        return function (reducer: Reducer<any, any>, preloadedState: any) {
            const store = createStore(reducer, preloadedState);
            reducers.forEach((red: AgentReducer) => {
                red.env.expired = false;
            });
            storeMap.set(store, {
                getAgentReducerMap: () => agentReducerMap,
                getAgentReducer: getClassReducer
            });
            return store;
        }
    }

    let combinedReducer = combineReducers(reducers);

    return Object.assign(combinedReducer, {enhancer});
}

export function createReduxAgent(dxModule: ReduxModule): { reducers: { [key: string]: AgentReducer }, enhancer: Enhancer } {

    function toReducer(dxReducer: OriginAgent,useLegacy?:boolean): AgentReducer {
        return createAgentReducer(dxReducer, {expired: true, updateBy: 'manual',legacy:!!useLegacy});
    }

    let agentReducerMap: AgentReducerMap = new Map();
    let reducers: { [key: string]: AgentReducer } = {};
    for (const [key, ReducerClass] of Object.entries(dxModule)) {
        const dxReducer = new ReducerClass();
        dxReducer[getAgentNamespaceKey()] = key;
        const reducer = toReducer(dxReducer,(ReducerClass as { new(): OriginAgent }&{useLegacy?:boolean}).useLegacy);
        reducers[key] = reducer;
        agentReducerMap.set(ReducerClass, reducer);
    }

    function getClassReducer(reducerClass: AgentClass) {
        const transition = agentReducerMap.get(reducerClass);
        if (!transition) {
            throw new Error('please use createReduxEnv to create a reducer first.')
        }
        return transition;
    }

    function enhancer(createStore: StoreCreator) {
        return function (reducer: Reducer<any, any>, preloadedState: any) {
            const store = createStore(reducer, preloadedState);
            Object.values(reducers).forEach((red: AgentReducer) => {
                red.env.expired = false;
            });
            storeMap.set(store, {
                getAgentReducerMap: () => agentReducerMap,
                getAgentReducer: getClassReducer
            });
            return store;
        }
    }

    return {reducers, enhancer};
}

export const getAgentReducerMapByStore = (store: Store): AgentReducerMapGetter => {
    const getter = storeMap.get(store);
    if (!getter) {
        throw new Error('this store has no transitionGetter. or has not used');
    }
    return getter;
};

export const getAgentByStoreClass = <S, T extends OriginAgent<S>>(store: Store, agentClass: AgentClass<S, T>): T => {
    const reducer = getAgentReducerMapByStore(store).getAgentReducer(agentClass);
    const agent = reducer.agent;
    const namespace = agent[getAgentNamespaceKey()];
    const state = store.getState();
    reducer.update(namespace ? state[namespace] : state, store.dispatch);
    return agent;
};

export const legacy=(module:ReduxModule)=>{
    const entries=Object.entries(module);
    const newEntries=entries.map(([key,value])=>{
        const copyValue=Object.create(Object.getPrototypeOf(value),Object.getOwnPropertyDescriptors(value));
        return [key,Object.assign(copyValue,{useLegacy:true})];
    });
    return Object.fromEntries(newEntries);
}

