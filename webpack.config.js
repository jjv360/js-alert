//
// Webpack config file

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {

    // Use production mode
    mode: "production",

    // Entry file
    entry: {
        main: path.resolve(__dirname, './src/index.js')
    },

    // Final output file
    output: {
        path: path.resolve(__dirname, './dist'),
        clean: true,
        filename: 'jsalert.min.js',
        library: {
            name: 'JSAlert',
            type: 'global',
            export: 'default'
        }
    },

    // Generate source map
    devtool: 'source-map',

    module: {
        rules: [
            // Load images
            {
                test: /\.(svg|png|gif|jpg)$/,
                type: 'asset/resource',
            },

            // Load JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: "defaults" }]
                        ]
                    }
                }
            }
        ]
    }

}