import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';


export default {
  input: 'src/citationnet-js/index.ts', // Entry point for your application
  output: {
    file: 'dist/citationnet.js', // Output file
    format: 'iife', // Output format (CommonJS)
    sourcemap: true, // Generate source map
    name: "citationnet",
  },
  plugins: [
    typescript(),
    postcss({
      extract: true,
      minimize: true,
      sourceMap: true,
    }),
    resolve(), // Resolve node_modules dependencies
    commonjs(), // Convert CommonJS modules to ES6
    babel({
      exclude: 'node_modules/**', // Only transpile our source code
      babelHelpers: 'bundled',
    }),
    terser(), // Minify the bundle
  ],
};