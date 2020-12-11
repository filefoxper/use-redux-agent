import {useSelector, useStore, useDispatch} from 'react-redux';
import {getAgentNamespaceKey, OriginAgent} from "agent-reducer";
import {AgentClass} from "./redux.type";
import {getAgentReducerMapByStore} from "./redux";

function createEquality<S>(stateChangeComparator?: (state: S) => Array<any>) {
    if (!stateChangeComparator) {
        return;
    }
    return function eq(prevState: S, state: S) {
        const prev = stateChangeComparator(prevState);
        const current = stateChangeComparator(state);
        if(prev.length!==current.length){
            return false;
        }
        return prev.every((element,index)=>Object.is(element,current[index]));
    }
}

export const useReduxAgent = <S = any, T extends OriginAgent<S> = OriginAgent<S>>(agentClass: AgentClass<S, T>, stateChangeComparator?: (state: S) => Array<any>): T => {
    const store = useStore();
    const {getAgentReducer} = getAgentReducerMapByStore(store);
    const reducer = getAgentReducer(agentClass);
    const agent = reducer.agent;
    const namespace = agent[getAgentNamespaceKey()];
    const dispatch = useDispatch();
    const state = useSelector((state: any) => namespace ? state[namespace] : state,createEquality(stateChangeComparator));
    reducer.update(state, dispatch);
    return agent;
};
