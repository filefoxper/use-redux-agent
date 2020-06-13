import React, {memo, useMemo} from 'react';
import {Provider} from 'react-redux';
import store from './module';
import {useReduxAgent} from "use-redux-agent";
import User from "./module/user";
import {Button, Select} from "antd";

const Option = Select.Option;

const CurrentUser = memo(() => {
    const {state} = useReduxAgent(User, (state) => [state.current.id]);
    const {name, role, version} = state.current;
    const roleName = useMemo(() => ['guest', 'user', 'master', 'admin'][role], [role]);
    return (
        <div style={{marginTop:8}}>
            <span>{name}：</span>
            <span>{roleName}</span>
            <span style={{marginLeft:8,color:'blue'}}>watch the version change:{version}</span>
            <span style={{marginLeft:8}}>the version won't change when you fetchUsers again because useReduxAgent use stateChangeComparator</span>
        </div>
    );
});

const UserSelect = memo(() => {
    const {state, switchCurrent, fetchUsers} = useReduxAgent(User);
    const {current, users} = state;
    return (
        <div style={{marginTop:8}}>
            <Select style={{width:200}} value={current.id} onChange={switchCurrent}>
                {
                    users.map((user) => (
                        <Option value={user.id} key={user.version.toString()}>{user.name}（version:{user.version}）</Option>
                    ))
                }
            </Select>
            <Button style={{marginLeft:8}} type="primary" onClick={fetchUsers}>fetch users</Button>
        </div>
    );
});

export default () => {
    return (
        <Provider store={store}>
            <div style={{padding:12}}>
                <CurrentUser/>
                <UserSelect/>
            </div>
        </Provider>
    );
}