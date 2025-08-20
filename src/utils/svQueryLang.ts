import validFilters from './validFilters'
import * as monaco from 'monaco-editor'

export const svQueryLang = {
  defaultToken: 'invalid',
  tokenPostfix: '.svQuery',

  keywords: ['OR', 'AND'],

  brackets: [{ open: '(', close: ')', token: 'delimiter.parenthesis' }],

  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },

      [/[()]/, '@brackets'],

      // Invalid typos of "or"
      // use lookahead to avoid catching words prefixed by or*
      [/or(?= )/, 'invalid'],
      [/oR(?= )/, 'invalid'],
      [/Or(?= )/, 'invalid'],
      [/[pP][rR](?= )/i, 'invalid'],
      [/[iI][rR](?= )/i, 'invalid'],
      [/[rR][oO](?= )/i, 'invalid'],
      // Invalid typos of "and"
      [/and(?= )/, 'invalid'],
      [/aND(?= )/, 'invalid'],
      [/ANd(?= )/, 'invalid'],
      [/NAD(?= )/, 'invalid'],

      [/-/, 'custom-negation'],

      [/\*/, 'custom-wildcard'],
      [/@[0-9a-zA-ZÀ-ÖØ-öø-ÿ_]+/, 'custom-twitter-user'],
      [/#[0-9a-zA-ZÀ-ÖØ-öø-ÿ]+/, 'custom-hashtag'],
      // one entry per filter prefix
      ...validFilters.map((filterPrefix) => [new RegExp(`${filterPrefix}:`), 'custom-label']),
      // Mark filters with other prefixes as invalid
      [/[a-zA-Z_]+:/, 'invalid'],
      [/[:]/, 'invalid'],

      [
        /[0-9a-zA-ZÀ-ÖØ-öø-ÿ_]*(~\d+)?/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
    ],

    // Deal with white space, including single and multi-line comments
    whitespace: [
      [/\s+/, 'white'],
      [/('''.*''')|(""".*""")/, 'string'],
    ],

    // Recognize hex, negatives, decimals, imaginaries, longs, and scientific notation
    numbers: [
      [/-?0x([abcdef]|[ABCDEF]|\d)+[lL]?/, 'number.hex'],
      [/-?(\d*\.)?\d+([eE][+-]?\d+)?[jJ]?[lL]?/, 'number'],
    ],

    // Recognize strings, including those broken across lines with \ (but not without)
    strings: [
      [/'$/, 'string.escape', '@popall'],
      [/'/, 'string.escape', '@stringBody'],
      [/"$/, 'string.escape', '@popall'],
      [/"/, 'string.escape', '@dblStringBody'],
    ],
    stringBody: [
      [/[^\\']+$/, 'string', '@popall'],
      [/[^\\']+/, 'string'],
      [/\\./, 'string'],
      [/'/, 'string.escape', '@popall'],
      [/\\$/, 'string'],
    ],
    dblStringBody: [
      [/[^\\"]+$/, 'string', '@popall'],
      [/[^\\"]+/, 'string'],
      [/\\./, 'string'],
      [/"/, 'string.escape', '@popall'],
      [/\\$/, 'string'],
    ],
  },
} as monaco.languages.IMonarchLanguage | monaco.Thenable<monaco.languages.IMonarchLanguage>
