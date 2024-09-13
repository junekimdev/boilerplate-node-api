/********************
 * User Input Inquirer
 ********************/
const readline = require('readline');
/**
 * @param {string} query
 * @returns {Promise<string>}
 */
const askQuestion = (query) => {
  const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    interface.question(`${query} `, (ans) => {
      interface.close();
      resolve(ans);
    }),
  );
};

/********************
 * Argument Parser
 ********************/
const convertBoolean = (v) => {
  if (v.toLowerCase() === 'true') return true;
  if (v.toLowerCase() === 'false') return false;
  return v;
};

const parseNamedArg = (arg) => {
  if (arg.includes('=')) {
    // key-value pair
    const [k, v] = arg.split('=');
    return [k, convertBoolean(v)];
  }
  return [arg, true]; // key-only arg
};

const parseArg = (arg) => {
  if (arg.startsWith('-')) {
    while (arg.startsWith('-')) arg = arg.slice(1); // Remove '-'symbols
    return parseNamedArg(arg);
  }
  return ['_', arg]; // value-only arg
};

const getArgs = () => {
  const result = {};
  result._ = [];
  const args = process.argv.slice(2); // Remove execution file

  for (let i = 0; i < args.length; i++) {
    const [k, v] = parseArg(args[i]);
    result[k] = k === '_' ? [...result[k], v] : v;
  }

  if (result.length === 0) console.warn('No arguments found');
  return result;
};

module.exports = { getArgs, askQuestion };
