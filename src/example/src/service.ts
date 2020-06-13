export const fetchUsers = () => {
    const version = new Date().getTime();
    return Promise.resolve([
        {id: 0, name: 'Jimmy', role: 1, version},
        {id: 1, name: 'Daisy', role: 2, version: version + 1},
        {id: 2, name: 'Tony', role: 3, version: version + 2}
    ]);
};