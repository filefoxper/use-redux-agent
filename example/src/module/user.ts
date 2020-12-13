import {LifecycleMiddleWares, middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {fetchUsers} from "../service";

enum Role {
    GUEST,
    USER,
    MASTER,
    ADMIN
}

interface UserDto {
    readonly id: number | undefined,
    readonly name: string,
    readonly role: Role,
    readonly version: number
}

interface UserState {
    readonly current: UserDto,
    readonly users: Array<UserDto>
}

const defaultUser:UserDto = {id: -1, name: 'GUEST', role: Role.GUEST, version: 0};

const getDefaultUserState = () => {
    return {
        current: defaultUser,
        users: [defaultUser]
    }
};

export default class User implements OriginAgent<UserState> {

    static initialState = async (): Promise<UserState> => {
        const users = await fetchUsers();
        return {current: defaultUser, users: [defaultUser].concat(users)};
    };

    state = getDefaultUserState();

    private handleUsersChange(users: Array<UserDto>) {
        const {current} = this.state;
        const nextUsers = [defaultUser].concat(users);
        const nextCurrent = nextUsers.find((u) => u.id === current.id) || defaultUser;
        return {current: nextCurrent, users: nextUsers};
    }

    @middleWare(MiddleWarePresets.takeLazy(500))
    async fetchUsers() {
        const users = await fetchUsers();
        return this.handleUsersChange(users);
    };

    switchCurrent(id?: number) {
        const current = this.state.users.find((u) => u.id === id);
        return {...this.state, current};
    }

}