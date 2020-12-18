[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-redux-agent.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-redux-agent
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

### 注意

当前版本响应`agent-reducer@3.1.0+`版本的号召，支持`agent-reducer@1.*`特性及写法，
只需要对老版本`modules`使用 [legacy](#legacy) 方法即可。
`use-redux-agent`不受`agent-reducer`全局环境设置 (`globalConfig`)`env.legacy` 影响。

# use-redux-agent

### redux

作为一个状态管理工具，redux非常的优异，在全局数据管理方面尤为突出。而redux使用的数据处理机制 reducer 更是让热衷于函数式编程的程序员爱不释手，
甚至连 react 官方也推出了 useReducer 作为非全局数据管理的替代品。但 reducer 也有一些小缺点，比如需要通过 dispatch 事件分发来管理状态。
这里我们使用 agent-reducer 语法糖，让 reducer 的使用更接近于对象方法调用，更加自然方便。

关于 [agent-reducer](https://www.npmjs.com/package/agent-reducer) 。
### 换种写法
```typescript
import {OriginAgent} from "agent-reducer";

    interface Action {
        type?: 'stepUp' | 'stepDown' | 'step' | 'sum',
        payload?: number[] | boolean
    }

    /**
     * 经典reducer
     * @param state
     * @param action
     */
    const countReducer = (state: number = 0, action: Action = {}): number => {
        switch (action.type) {
            case "stepDown":
                return state - 1;
            case "stepUp":
                return state + 1;
            case "step":
                return state + (action.payload ? 1 : -1);
            case "sum":
                return state + (Array.isArray(action.payload) ?
                    action.payload : []).reduce((r, c): number => r + c, 0);
            default:
                return state;
        }
    }

    /**
     * class写法
     */
    class CountAgent implements OriginAgent<number> {

        state = 0;
        
        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        sum = (...counts: number[]): number => {
            return this.state + counts.reduce((r, c): number => r + c, 0);
        };

    }
```
以上代码是一段简单的计数器，`CountAgent`通过调用对象属性方法的形式来完成一个`reducer action`分支，
`return`值作为计算完后的`this.state`数据（这里并未涉及state维护器，所以先当作有这么一个黑盒工具）。
有点像reducer，但省去了action的复杂结构（action为了兼容多个分支的不同需求所以很难以普通传参方式来工作）。

### 用在 redux 上

[可参考例子](https://github.com/filefoxper/use-redux-agent/tree/master/example)

module 业务数据模型：module/count.ts

```typescript
import {middleWare,MiddleWarePresets, OriginAgent} from "agent-reducer";

class CountAgent implements OriginAgent<number> {

    // 全局统一初始化数据方法，在调用 use-agent-redux 提供的 initialStates 方法时被统一调用，
    // 并把 resolve 或 return 非promise 的数据 dispatch 到 store中相应的 state 中
    static initialState(){
        return Promise.resolve(1);
    }

    // 初始化的state数据，根据redux要求不能为 undefined
    state = 0;
        
    // 方法调用后的返回值被 dispatch 到 store相应的 state 中，并成为当前的 this.state
    stepUp = (): number => this.state + 1;

    stepDown = (): number => this.state - 1;

    step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    sum(...counts: number[]): number {
        return this.state + counts.reduce((r, c): number => r + c, 0);
    };

    // 返回对象为 promise ，如果没有使用 agent-reducer 的 MiddleWare，
    // this.state 将变成一个 promise 对象。
    // 这里使用了 MiddleWarePresets.takePromiseResolve() 将 promise resolve 的数据dispatch出去，
    // 并成为 this.state
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async requestAndSum(){
        const remote=await Promise.resolve(3);
        return this.sum(remote); 
    }   

}
```
关于 agent-reducer 模型及 MiddleWares 的使用，可以参考： [agent-reducer](https://www.npmjs.com/package/agent-reducer) 。

root 创建 store，并将模型reducer化 module/index.ts

```typescript
import {createStore} from "redux";
import count from './count';
import {createReduxAgentReducer} from "use-redux-agent";

const modules={
    count
};

// 将modules打包成一个reducer方法
const reducer = createReduxAgentReducer(modules);

// 使用 redux 的 createStore 和绑定好的 reducer 创建 store，
// reducer.enhancer 是必要的，用来组建 store 和 agent 的关系
const store = createStore(reducer, reducer.enhancer);

export default store;
```

total layout 将store加入react-redux的Provider layout.tsx
 
```tsx

import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import store from './module';
import {initialStates} from "use-redux-agent";
import Apply from './apply.tsx'

export default () => {
    useEffect(()=>{
        // 初始化所有具备 static
        initialStates(store);
    },[]);
    return (
        <Provider store={store}>
            <Apply/>
        </Provider>
    );
}
```

apply 应用，监听数据变化触发渲染（组件中获取最新数据）、dispatch action apply.tsx

```tsx
import React ,{useEffect}from 'react'; 
import Count from './module/count.ts'
import {useReduxAgent} from "use-redux-agent";

export default ()=>{
    // useReduxAgent 直接传入 Module 的 class 模型就可以取到 agent 了
    // agent 的 state 就是 store 中对应当前模型的 state，所有方法调用都有自动dispatch action功能
    const {state,stepUp,stepDown,requestAndSum}=useReduxAgent(Count);

    useEffect(()=>{
        requestAndSum();
    },[]);

    return (
        <div>
            <button onClick={stepUp}>stepUp</button>
            <span>{state}</span>
            <button onClick={stepDown}>stepDown</button>
        </div>
    );
}
```

为什么不用`namespace`，因为 use-redux-agent 认为 class 直接代表了模型，
只要取到模型就应该可以拿到相关数据，并可以直接操作才对，所以与普世的redux作风有所不同。

 [agent-reducer](https://www.npmjs.com/package/agent-reducer) 是 use-redux-agent 的基础。
 要想更容易的使用 use-redux-agent ，建议可以参考 agent-reducer 文档。关于 MiddleActions 的使用，建议可以引入
 [use-agent-reducer](https://www.npmjs.com/package/use-agent-reducer) 的 `useMiddleActions` 功能。
 
 ### API
 
 1 . createReduxAgentReducer
 
 创建一个 reducer 方法，该 reducer 带有一个 redux 标准的 enhancer 用于组合 store, reducer, agent 之间的关系。
 
 入参：modules object，一个由一个或多个 module class 组成的 object 模型。
 每个 module class 是一个`origin-agent`( agent-reducer 定义 )，这个 class 的 state 来自redux存储的模型数据，
 class 实例方法调用相当于 dispatch action，而 static 方法 initialState，可以通过`API`的另一个方法`initialStates(store)`统一调用。
 
 返回：reducer方法，方法reducer.enhancer是一个标准的redux createStore enhancer。
 
 返回后使用方式：
 ```typescript
 import {createStore} from "redux";
 import module from './module';
 import {createReduxAgentReducer} from "use-redux-agent";
 
 const modules={
     module
 };
 
 // 将modules打包成一个reducer方法
 const reducer = createReduxAgentReducer(modules);
 
 // 使用 redux 的 createStore 和绑定好的 reducer 创建 store，
 // reducer.enhancer 是必要的，用来组建 store 和 agent 的关系
 const store = createStore(reducer, reducer.enhancer);
 
 export default store;
 ```

 2 . initialStates

 统一初始化modules state 数据的方法，所有带有 static initialState 方法的 module class 都可以被统一初始化，
 static 方法 initialState 放回的如果是个 promise 对象，则会使用 promise resolve 数据作为初始的 this.state，
 如果返回普通对象，该对象及为初始化完成后的 this.state。
 
 入参：redux的store
 
 返回：promise，初始化是否全部结束，可以通过返回的promise resolve获知。
 
 3 . useReduxAgent
 
 通过 module class 获取对应的agent，当store对应class的module数据更新时，会触发agent同步(从而导致组件自动render)，
 agent还可以通过调用方法来完成 dispatch 的事情。
 
 入参：module class
 
 返回：module class对应的agent
 
 4 . <span id="legacy">legacy ( >=3.1.0 )</span>
 
 将 modules 设置成支持`agent-reducer@1.*`版本的 modules。
 
 入参：modules - { [key:string] : module class }
 
 返回：带有老版本支持标记的 modules - { [key:string] : module class [static useLegacy=true] }
 
 当然在每个想要支持`agent-reducer@1.*`版本的 module class 上加上 static useLegacy=true 也是一样的效果
 ```ts
    import {OriginAgent} from "agent-reducer";

    class User implements OriginAgent<any>{

        static useLegacy=true;
        
        state={};

    }   
 ```
或
```typescript
import {legacy,createReduxAgentReducer} from "use-redux-agent";
import UserModule from './user';
import RolesModule from './roles';
import {createStore} from "redux";

// 使用 legacy 方法将需要使用 agent-reducer@1.* 特性的 module classes 标记为 static 
const legacyModules = legacy({
    user:UserModule
});

const  modules={
    ...legacyModules,
    roles:RolesModule
}

// 将modules打包成一个reducer方法
const reducer = createReduxAgentReducer(modules);

// 使用 redux 的 createStore 和绑定好的 reducer 创建 store，
// reducer.enhancer 是必要的，用来组建 store 和 agent 的关系
const store = createStore(reducer, reducer.enhancer);

export default store;
```
 
 [可参考例子](https://github.com/filefoxper/use-redux-agent/tree/master/example)
 
 [change logs](https://github.com/filefoxper/use-redux-agent/tree/master/CHANGE_LOG.md)

