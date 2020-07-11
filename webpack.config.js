const webpack = require('webpack');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const pathBuilder = require('path');

const entryPath = pathBuilder.resolve('src', 'index.ts');

const targetPath = pathBuilder.resolve('dist');

const reactExternal = {
    root: 'React',
    commonjs2: 'react',
    commonjs: 'react',
    amd: 'react',
};

const reactDOMExternal = {
    root: 'ReactDOM',
    commonjs2: 'react-dom',
    commonjs: 'react-dom',
    amd: 'react-dom',
};

const reactReduxExternal = {
    root: 'ReactRedux',
    commonjs2: 'react-redux',
    commonjs: 'react-redux',
    amd: 'react-redux',
};

const reduxExternal = {
    root: 'Redux',
    commonjs2: 'redux',
    commonjs: 'redux',
    amd: 'redux',
};

const agentReducerExternal = {
    root: 'AgentReducer',
    commonjs2: 'agent-reducer',
    commonjs: 'agent-reducer',
    amd: 'agent-reducer',
};

function entry() {
    return {
        externals: {
            'react': reactExternal,
            'react-dom': reactDOMExternal,
            'react-redux':reactReduxExternal,
            'redux':reduxExternal,
            'agent-reducer':agentReducerExternal
        },
        mode: 'production',
        devtool: false,
        entry: {
            ['use-redux-agent']: entryPath,
            ['use-redux-agent.min']: entryPath
        },
        output: {
            path: targetPath,
            filename: '[name].js',
            library: 'use-redux-agent',
            libraryTarget: 'umd'
        },
        optimization: {
            noEmitOnErrors: true,
            minimize: true,
            minimizer: [
                new UglifyJsPlugin({
                    include: /\.min\.js$/
                }),
            ],
            namedChunks: true
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx', '.json', 'txt']
        },
        module: {
            rules: [
                {
                    test: /\.js$|\.ts$|\.tsx$/,
                    exclude: /(node_modules|bower_components)/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: true,
                                plugins: [
                                    ["@babel/plugin-transform-runtime"],
                                    ['@babel/plugin-proposal-export-namespace-from'],
                                    [
                                        '@babel/plugin-proposal-class-properties',
                                        {loose: true},
                                    ]
                                ],
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            modules: false
                                        }
                                    ],
                                    '@babel/preset-react',
                                    '@babel/preset-typescript'
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            })
        ]
    }
}

module.exports = function (env) {
    return entry();
};
