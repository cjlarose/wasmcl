import compile from './compile';

function compileAndExecute(source) {
  const view = compile(source);
  const wasmModule = Wasm.instantiateModule(view, {});
  return wasmModule.exports.entry();
}

// literals
console.log('Literals');
console.log(compileAndExecute('238') >> 2);
// console.log(compileAndExecute('-238'));
console.log(compileAndExecute('0x1') >> 2);
console.log(compileAndExecute('0x99ccff') >> 2);
console.log(compileAndExecute('true') >> 2);
console.log(compileAndExecute('false') >> 2);
//console.log(String.fromCharCode(compileAndExecute("'\\x7E'")));

// unary operations
console.log('Unary operations');
console.log(compileAndExecute('(not true)') >> 2);
console.log(compileAndExecute('(not false)') >> 2);

console.log(compileAndExecute('(fixnum? 238)') >> 2);
console.log(compileAndExecute('(fixnum? false)') >> 2);

console.log(compileAndExecute('(boolean? 238)') >> 2);
console.log(compileAndExecute('(boolean? false)') >> 2);

// binary operations
console.log('Binary operations');
console.log(compileAndExecute('(+ 55)') >> 2);
console.log(compileAndExecute('(+ 45 55)') >> 2);
console.log(compileAndExecute('(+ 45 55 50)') >> 2);
console.log(compileAndExecute('(+ 45 55 50 100)') >> 2);

console.log(compileAndExecute('(- 55)') >> 2);
console.log(compileAndExecute('(- 55 5)') >> 2);
console.log(compileAndExecute('(- 45 55 50)') >> 2);
console.log(compileAndExecute('(- 45 55 50 100)') >> 2);

// local variables
console.log(compileAndExecute('(let ((a 0xFF) (b 1)) (+ a b))') >> 2);
