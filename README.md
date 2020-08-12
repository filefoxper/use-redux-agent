[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-redux-agent.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-redux-agent
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-redux-agent

### new changes
1. The arrow function in origin agent will not be supported as an dispatch function from this version. (For this feature has to built by changing property define about the origin agent)
2. We have made it support IE browsers from version 9. 

### redux
We often use redux and react-redux to manage our global states in react app, and it has done this job well so far.
But we want more easier way to write code by using 'useSelector' and 'useDispatch'.

So, we use [agent-reducer](https://www.npmjs.com/package/agent-reducer) to make react-redux more easier.
### make useSelector and useDispatch together like a class instance
Now, let's use redux like this:

more [example](https://github.com/filefoxper/use-redux-agent/tree/master/example)
```typescript jsx
import React,{useEffect} from 'react';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import {OriginAgent} from 'agent-reducer';
import {createReduxAgentReducer,useReduxAgent,getAgentByStoreClass} from "use-redux-agent";
import {fetchUser,fetchAddition} from './userService';

enum Role{
    GUEST=0,
    USER=1,
    MASTER=2,
    ADMIN=3
}

interface UserAddition{
    userId:number,
    lastLoginTime:Date,
    expiredDate:Date
}

interface UserState {
  id?:number,
  name:string,
  role:Role,
  addition?:UserAddition
}

class User implements OriginAgent<UserState> {

    state = {id:undefined,name:'GUEST',role:Role.GUEST,addition:undefined};

    public changeUser(user:UserState) {
        return user;
    }
    
    public setAddition(addition:UserAddition) {
        if(addition.userId === this.state.id){
            return {...this.state,addition}
        }
        return this.state;
    }

    public async fetchUser(id:number) {
        const user = await fetchUser(id);
        this.changeUser(user);
    }
    
    public async fetchAddition(userId:number){
        const user = await fetchAddition(userId);
        this.setAddition(user);
    }

}

const reducer = createReduxAgentReducer({User});

const store = createStore(reducer,reducer.enhancer);

function App() {
    
    useEffect(()=>{
        const agent=getAgentByStoreClass(store,User);
        agent.fetchUser();
    },[]);
    
  return (
      <Provider store={store}>
        <MyComponent/>
      </Provider>
  );
}

function MyComponent() {
    
  const {state,fetchAddition} = useReduxAgent(User);
  
  const {addition}=state;
  
  return (
      <div>
        <div>
            <span>{state.name}</span>
            <span>（{state.role}）</span>
            <button onClick={fetchAddition}>fetchAddition</button>
        </div>
        {addition?(
            <div>
                <span>{addition.lastLoginTime.toDateString()}</span>
                <span>{addition.expiredDate.toDateString()}</span>
            </div>
            ):null
        }
      </div>
  );
}
```
The code above gives us a new style to write a <strong>useSelector</strong> and <strong>useDispatch</strong>, 
and it using <strong>useReduxAgent</strong> to do the job together. 
The [agent-reducer](https://www.npmjs.com/package/agent-reducer) transform an <strong>originAgent class or object</strong> to reducer,
and provide a handler for usage. 

Let's analyze this code. 

The function `changeUser` and `setAddition` returns a next state, like a true reducer when it invoked.
This writing style let you trigger a dispatch like deploy a normal function, and do not need an action style. 
The current state can be retrieve from this.state. So, We don't have to write a reducer like this now:
```typescript
......
const user=(state:User,action:Action)=>{
    if(action.type === 'changeUser'){
        const {payload}=action;
        return payload;
    }
    if(action.type === 'setAddition'){
        const {payload}=action;
        if(payload.userId===state.id){
            return {...state,addition:payload};
        }else{
            return state;
        }
    }
    return state;
};

function asyncFetchUser(id:number){
    fetchUser(id).then((user)=>dispatch({type:'changeUser',payload:user}));
}
......
```
If you are using typescript, the type system will give you more infos to keep your code reliable.
There are some rules for using this tool better, and trust me, they are simple enough.
### declare
<strong>
We do not think combine reducers with a deep structrue can bring you any goods. 
So, we do not support you using combineReducers after you get the reducer create from createReduxAgentReducer,
 if you do this, your agent and modules can not be found. And that will cause useReduxAgent function work fail.
 So, keep your modules flatten. 
</strong>

### rules
1 . The class to `useReduxAgent` function is called <strong> originAgent</strong>. To be an <strong>originAgent</strong>, 
it must has a <strong>state</strong> property. Do not modify <strong>state</strong> manually. 
this.state preserve the current state, so you can compute a <strong>next state</strong> by this.state and params in an <strong>originAgent</strong> function.

2 . The object `useReduxAgent(originAgent)` is called <strong>agent</strong>. 
And the function in your <strong>agent</strong> which returns an object <strong>not</strong> undefined or promise, 
will be an <strong>dispatch function</strong>, when you deploy it, an action contains next state will be dispatched to a true reducer.  
```
like agent.changeUser, agent.setAddition
```
3 . The function which returns <strong>undefined | promise</strong> is just a simple function,
which can deploy <strong>dispatch functions</strong> to change state.
```
like agent.fetchAddition
```
4 . <strong>Do not use namespace property</strong> in your agent class. 
The property '<strong>namespace</strong>' will be used in createReduxAgentReducer function.

5 . <strong>Do not use arrow function in originAgent</strong>.

### features
1. Do not worry about using <strong>this.xxx</strong>, when you are using <strong>useReduxAgent(agent:OriginAgent)</strong>.
The <strong>result useReduxAgent</strong> return is rebuild by proxy and Object.defineProperties, and the functions in it have bind <strong>this</strong> by using sourceFunction.apply(agentProxy,...args),
so you can use those functions by reassign to any other object, and <strong>this</strong> in the function is locked to the <strong>result useAgent</strong> return.

more [example](https://github.com/filefoxper/use-redux-agent/tree/master/example)

### api
###### useReduxAgent (hook)
This hook function is used to build an connect with redux, when the state of your Agent class module changes, it invokes.

Give it an Agent class as param, you will receive an connected agent.

Give it the optional param, you can judge if the component should render by state change.

The second param stateChangeComparator is a function with param state, and you should return an array,
if any element of array is changed between prev state and current state mapped, it will drive your component render.
```typescript
/**
* 
* @param agentClass                 for select the agent
* @param stateChangeComparator      judge if then state change should render your component    
* 
* @return agent which you will use to deploy, state for render, and functions for dispatch or effect
*/
declare function useReduxAgent<S = any, T extends OriginAgent<S> = OriginAgent<S>>(agentClass: AgentClass<S, T>, stateChangeComparator?: (state: S) => Array<any>): T

/**
* the agent plays like a classify reducer, which must has a state. Be careful about namespace
*/
interface OriginAgent<S = any> {
  state: S,
  namespace?: string
}

export type AgentClass<S = any, T extends OriginAgent<S> = OriginAgent<S>> = {
  new(): T,
  initialState?: () => Promise<S>
}

/****** sample ******/
import {User} from 'module';
......
const {state,addAddition,fetchUser}=useReduxAgent(User);
......
```
###### createReduxAgentReducer (function)
This function is used to build a reducer which combined by your module object.

Give it a module object as param, you can receive a reducer with enhancer (createStore enhancer) for it's property.
```typescript
/**
* 
* @param dxModule   It is an object whose values are Agent classes
* 
* @return reducer   It is a reducer function, which is combined from a module object, and it has a enhancer property which value should add to your createStore.  
*/
declare function createReduxAgentReducer(dxModule: ReduxModule): Reducer<any, Action> & { enhancer: Enhancer }

/**
* It is an object whose values are Agent classes
*/
interface ReduxModule {
  [key: string]: { new(): OriginAgent }
}

/**
* use enhancer when you createStore
*/
type Enhancer=(createStore: StoreCreator) => (reducer: Reducer<any, any>, preloadedState: any) => any;

/**
* the agent plays like a classify reducer, which must has a state. Be careful about namespace
*/
interface OriginAgent<S = any> {
  state: S,
  namespace?: string
}

/****** sample ******/
export class User implements OriginAgent<UserState> {

    state = {id:undefined,name:'GUEST',role:Role.GUEST,addition:undefined};

    public changeUser(user:UserState) {
        return user;
    }
    
    public setAddition(addition:UserAddition) {
        if(addition.userId === this.state.id){
            return {...this.state,addition}
        }
        return this.state;
    }

    public async fetchUser(id:number) {
        const user = await fetchUser(id);
        this.changeUser(user);
    }

}

const module = {User};
const reducer = createReduxAgentReducer(module);
const store = createStore(reducer,reducer.enhancer);
......
```
###### getAgentByStoreClass (function)
When you want to have an agent from your module, you could use getAgentByStoreClass function too.

Give a redux store object and the agent class, you can retrieve your agent.

<div style="color:red">
It is very different with <strong>useReduxAgent</strong>, this function just give out the agent it found,
but do not build connection with store, so it is often used in your simple function, not in a react component. 
</div>

```typescript
/**
* 
* @param store          a redux store which is created by using createReduxAgentReducer
* @param agentClass     an agent class which you want to be as your module
* 
* @return agent         an agent as your module
*/
declare function getAgentByStoreClass<S, T extends OriginAgent<S>>(store: Store, agentClass: AgentClass<S, T>): T
```
###### initialStates (function)
This function can be used when you want to initial your state of your agent class modules together.
When your deploy it, and give a a redux store which is created by using createReduxAgentReducer, 
it will deploy the <strong>static initialState</strong> function in your agent class if <strong>static initialState</strong> exist,
and wait for all of those initialState functions are resolved. 
```typescript
/**
* 
* @param store          a redux store which is created by using createReduxAgentReducer
* 
* @return Promise<void>
*/
declare function initialStates(store: Store):Promise<void>
```
# summary
If you like it, please give me a little star here. ([github home](https://github.com/filefoxper/use-redux-agent))