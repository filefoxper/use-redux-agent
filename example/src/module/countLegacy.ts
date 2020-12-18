import {OriginAgent} from "agent-reducer";

export default class CountLegacy implements OriginAgent<number>{

    state=0;

    stepUp(){
        return this.state+1;
    }

    async remoteStepUp(){
        await Promise.resolve();
        this.stepUp();
    }

}