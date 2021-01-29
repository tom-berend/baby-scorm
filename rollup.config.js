import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'

export default {
    input: 'src/client/T.ts',
    plugins: [
        typescript({module: 'CommonJS'}),
        resolve(),
        commonjs({
            include: 'node_modules/**',
        })
    ],
    output: {
        file: 'dist/T.js',
        name: 'T.js',
        format: 'iife',
        globals: {
            alive: 'index'
        },
    }
}