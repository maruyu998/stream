const path = require('path');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: './client/src/index.tsx',
    output: {
        path: path.join(__dirname, 'client', 'public'),
        publicPath: 'client/public/',
        filename: 'main.js',
    },
    module: {
        rules: [{
            test: /\.(ts|tsx)$/,
            use: [{
                loader: 'babel-loader',
                options: { presets: ['@babel/preset-env', '@babel/react'] },
            },{
                loader: 'ts-loader',
                options: {
                    configFile: path.resolve(__dirname, 'tsconfig.json'),
                },
            }],
        },{
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
        }],
    },
    devServer: {
        static: [{
            directory: path.join(__dirname, 'client/public'),
            watch: true
        },{
            directory: path.join(__dirname, 'client/src'),
            watch: true
        }],
        port: process.env.PORT,
        hot: true,
        proxy: {'/api': 'http://localhost:'+process.env.PROXYPORT},
        watchFiles: {
            paths: [
                'client/*',
                'client/**/*',
                'client/**/**/*',
                'mtypes/*',
                'mutils/*'
            ],
            options: {
                usePolling: true,
                aggregateTimeout: 200,
                poll: 1000
            }
        }
    },
    resolve: {extensions: ['.ts', '.tsx', '.js', '.json']},
    target: 'web',
    performance: {
        maxEntrypointSize: 500000,
        maxAssetSize: 500000,
    },
}