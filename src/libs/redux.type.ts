import {OriginAgent, AgentReducer, Reducer} from "agent-reducer";
import {Store, StoreCreator} from "redux";

export interface ReduxModule {
  [key: string]: { new(): OriginAgent }
}

export type AgentClass<S = any, T extends OriginAgent<S> = OriginAgent<S>> = {
  new(): T,
  initialState?: () => Promise<S>
}

export type AgentReducerMap<S = any, T extends OriginAgent<S> = any> = Map<AgentClass<S, T>, AgentReducer<S, T>>;

export type AgentReducerMapGetter = { getAgentReducerMap: () => AgentReducerMap, getAgentReducer: (c: AgentClass) => AgentReducer };

export type StoreMap = Map<Store, AgentReducerMapGetter>;

export type ObjectMapValuesCallback<S> = (value: any, key: keyof S) => any;

export type Enhancer=(createStore: StoreCreator) => (reducer: Reducer<any, any>, preloadedState: any) => any;
