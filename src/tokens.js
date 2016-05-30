export const TOKEN_TYPES = {
  OPEN_PAREN: 'OPEN_PAREN',
  CLOSE_PAREN: 'CLOSE_PAREN',
  ID: 'ID',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
};

export const singleCharacterTokens = {
  '(': { type: TOKEN_TYPES.OPEN_PAREN },
  ')': { type: TOKEN_TYPES.CLOSE_PAREN },
};

export const reservedWords = {
  true: { type: TOKEN_TYPES.BOOLEAN,
          value: true },
  false: { type: TOKEN_TYPES.BOOLEAN,
           value: false },
};