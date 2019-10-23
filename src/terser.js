const { codeFrameColumns } = require('@babel/code-frame');
const { createFilter } = require('rollup-pluginutils');
const { minify } = require('terser');

const transform = code => {
  const result = minify(code);
  if (result.error) {
    throw result.error;
  } else {
    return result;
  }
};

function terser(userOptions = {}) {
  const filter = createFilter(userOptions.include, userOptions.exclude, { resolve: false });

  return {
    name: 'terser',

    renderChunk(code, chunk, outputOptions) {
      if (!filter(chunk.fileName)) {
        return null;
      }
      let result;
      try {
        result = transform(code);
      } catch (e) {
        const { message, line, col: column } = error;
        console.error(codeFrameColumns(code, { start: { line, column } }, { message }));
        throw error;
      }
      return result;
    },
  };
}

exports.terser = terser;
