import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';

const { main, module, typings } = require('./package.json');

const bundle = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: main,
        format: 'cjs',
        plugins: [terser()],
      },
      {
        file: module,
        format: 'esm',
        plugins: [terser()],
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: typings,
      format: 'esm',
    },
  }),
];
