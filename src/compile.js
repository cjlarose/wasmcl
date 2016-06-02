import { tokenize, parse } from './parse';
import { TOKEN_TYPES } from './tokens';
import {
  codeSection,
  functionBody,
  returnNode,
  i32Const,
} from './wasm_ast';

import { i32 } from './wasm_ast/simple_ops';

const FIXNUM_TAG = 1;
const BOOLEAN_TAG = 2;

function isImmediateValue(tokens) {
  if (tokens.length !== 1) return false;
  const token = tokens[0];
  return token.type === TOKEN_TYPES.INTEGER ||
         token.type === TOKEN_TYPES.BOOLEAN;
}

function immediateRepr(token) {
  switch (token.type) {
    case TOKEN_TYPES.INTEGER:
      return token.value << 2 | FIXNUM_TAG;
    case TOKEN_TYPES.BOOLEAN:
      return token.value << 2 | BOOLEAN_TAG;
    default:
      throw new Error(`Unexpected token type ${token.type}`);
  }
}

function markFixnum(exprAst) {
  return i32.or(i32.shl(exprAst, i32Const(2)), i32Const(FIXNUM_TAG));
}

function markBoolean(exprAst) {
  return i32.or(i32.shl(exprAst, i32Const(2)), i32Const(BOOLEAN_TAG));
}

function extractTag(exprAst) {
  return i32.and(exprAst, i32Const(3));
}

function extractFixnum(exprAst) {
  return i32.shrS(exprAst, i32Const(2));
}

// CL form -> WASM expression(s)
function generateCode(formOrImmediate) {
  if (Array.isArray(formOrImmediate)) {
    const [op, ...operands] = formOrImmediate;

    if (op.value === 'not' && operands[0].type === TOKEN_TYPES.BOOLEAN) {
      return markBoolean(i32.eqz(i32.shrU(generateCode(operands[0]), i32Const(2))));
    } else if (op.value === 'fixnum?') {
      return markBoolean(i32.eq(extractTag(generateCode(operands[0])), i32Const(FIXNUM_TAG)));
    } else if (op.value === 'boolean?') {
      return markBoolean(i32.eq(extractTag(generateCode(operands[0])), i32Const(BOOLEAN_TAG)));
    } else if (op.type === TOKEN_TYPES.PLUS) {
      const exprs = operands.map(operand => extractFixnum(generateCode(operand)));
      const sum = exprs.reduce((sumExpr, operand) => i32.add(sumExpr, operand));
      return markFixnum(sum);
    } else if (op.type === TOKEN_TYPES.MINUS) {
      if (operands.length === 1) {
        return markFixnum(i32.sub(i32Const(0), extractFixnum(generateCode(operands[0]))));
      }

      const exprs = operands.map(operand => extractFixnum(generateCode(operand)));
      const sum = exprs.reduce((diffExpr, operand) => i32.sub(diffExpr, operand));
      return markFixnum(sum);
    }

    throw new Error('Not yet implemented');
  }

  return i32Const(immediateRepr(formOrImmediate));
}

export default function compile(source) {
  const tokens = tokenize(source);
  const expr = generateCode(isImmediateValue(tokens) ? tokens[0] : parse(tokens));
  const code = codeSection(functionBody([], returnNode(1, expr)));

  return new Uint8Array([
    /* Magic number, version (11) */
    0x00, 0x61, 0x73, 0x6d, 0x0b, 0x00, 0x00, 0x00,

    /* section title length (4), section title "type", payload length (5) */
    0x04, 0x74, 0x79, 0x70, 0x65, 0x85, 0x80, 0x80, 0x80, 0x00,
    /* Entry count (1), Function, param count (0), return count (1), return type i32 */
    0x01, 0x40, 0x00, 0x01, 0x01,

    /* section title length (8), section title "function" */
    0x08, 0x66, 0x75, 0x6e, 0x63, 0x74, 0x69, 0x6f, 0x6e,
    /* payload length (2), */
    0x82, 0x80, 0x80, 0x80, 0x00,
    /* function count 1, index 0 */
    0x01, 0x00,

    /* section title length (6), section title "memory" */
    0x06, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79,
    /* payload length (5) */
    0x85, 0x80, 0x80, 0x80, 0x00,
    /* initial memory (2 x 64Kib pages), maximum memory (2 x 64Kib pages), not exported */
    0x80, 0x02, 0x80, 0x02, 0x00,

    /* section title length (6), section title "export", */
    0x06, 0x65, 0x78, 0x70, 0x6f, 0x72, 0x74,
    /* payload length (8) */
    0x88, 0x80, 0x80, 0x80, 0x00,
    /* count (1), export entry: index 0, function string length (5), "entry" */
    0x01, 0x00, 0x05, 0x65, 0x6e, 0x74, 0x72, 0x79,

    ...code,

    /* section title length (4), section title "name" */
    0x04, 0x6e, 0x61, 0x6d, 0x65,
    /* payload length (8) */
    0x88, 0x80, 0x80, 0x80, 0x00,
    /* entry count (1), function name length (5) "entry", local count (0) */
    0x01, 0x05, 0x65, 0x6e, 0x74, 0x72, 0x79, 0x00,
  ]);
}
