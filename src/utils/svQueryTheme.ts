import * as monaco from 'monaco-editor'

export const svQueryTheme = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '#B510FB' },
    { token: 'string', foreground: '#0030fa' },
    {
      token: 'custom-negation',
      foreground: '#d60001',
    },
    {
      token: 'invalid',
      foreground: '#dd0000',
      fontStyle: 'bold',
    },
    { token: 'custom-wildcard', foreground: '#158656' },
    { token: 'custom-twitter-user', foreground: '#00c4ff' },
    { token: 'custom-hashtag', foreground: '#ff761a' },
    { token: 'custom-label', foreground: '#6201fb' },
  ],

  colors: {
    'editor.foreground': '#333333',
  },
} satisfies monaco.editor.IStandaloneThemeData
