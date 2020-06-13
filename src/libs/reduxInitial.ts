import {getAgentReducerMapByStore} from "./redux";
import {Store} from "redux";
import {DefaultActionType} from "agent-reducer";

async function initialWithNamespace<S=any>(namespace?:string, initialState?:() => Promise<S>) {
  if (!initialState) {
    return [namespace];
  }
  const state = await initialState();
  return [namespace, state];
}

export async function initialStates(store: Store):Promise<void> {
  const {getAgentReducerMap} = getAgentReducerMapByStore(store);
  const transitions = getAgentReducerMap();
  const entries = Array.from(transitions.entries());
  const promises = entries.map(([DxReducerClass, {namespace}]) => {
    const initialState = DxReducerClass.initialState;
    return initialWithNamespace(namespace, initialState);
  });
  const states = await Promise.all(promises);
  const accesses = states.filter(([namespace, state]) => state !== undefined);
  accesses.forEach(([namespace, state]) => {
    store.dispatch({
      type: namespace + ':' + DefaultActionType.DX_INITIAL_STATE,
      args: state
    });
  });
}
