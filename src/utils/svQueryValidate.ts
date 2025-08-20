/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirstAmbiguousNode } from './astParser'
import validFilters from './validFilters'

export default function validate(query: any) {
  const markers = []

  // Count open and close parenthesis to make sure they match
  const parenthesisStack: any[] = []
  // Keep track of when we are in an exact match or not
  let isInStringFlag = false

  const queryPerLines = query.split('\n')
  queryPerLines.forEach((line: any, lineIdx: any) => {
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx]

      if (char === '"') {
        isInStringFlag = !isInStringFlag
      } else if (!isInStringFlag) {
        const orGroup = line.substr(charIdx - 1, 4) // substring used to detect mispelled "OR"s

        if (char === '(') {
          parenthesisStack.push({ line: lineIdx, col: charIdx })
        } else if (char === ')') {
          if (parenthesisStack.length > 0) {
            parenthesisStack.pop()
          } else {
            markers.push({
              message: `Parenthèse fermée sans équivalent ouverte`,
              startLineNumber: lineIdx + 1,
              startColumn: charIdx + 1,
              endLineNumber: lineIdx + 1,
              endColumn: charIdx + 2,
            })
          }
        } else if (char === ':') {
          // Find full word before ":"
          const lineWords = line.substr(0, charIdx).split(' ')
          const lastWord = lineWords[lineWords.length - 1]
          if (!validFilters.includes(lastWord)) {
            markers.push({
              message: `Préfixe de filtre invalide: ${lastWord}`,
              startLineNumber: lineIdx + 1,
              startColumn: charIdx - lastWord.length + 1,
              endLineNumber: lineIdx + 1,
              endColumn: charIdx + 1,
            })
          }
        } else if (orGroup !== ' OR ') {
          if (orGroup.match(/\s[oip]r\s/i) || orGroup.match(/\sro\s/i)) {
            markers.push({
              message: "Faute de frappe dans 'OR'",
              startLineNumber: lineIdx + 1,
              startColumn: charIdx + 1,
              endLineNumber: lineIdx + 1,
              endColumn: charIdx + 3,
            })
          }
        }
      }
    }
  })

  // Mark any remaining open parenthesis
  parenthesisStack.forEach(({ line, col }) =>
    markers.push({
      message: 'Parenthèse ouverte sans équivalent fermée',
      startLineNumber: line + 1,
      startColumn: col + 1,
      endLineNumber: line + 1,
      endColumn: col + 2,
    }),
  )

  // Find ambiguous nodes using the AST parser
  let ambiguousNode

  try {
    ambiguousNode = getFirstAmbiguousNode(query)
  } catch (err: any) {
    // The AST parser can crash on syntax error => make it a marker error
    if (err.name === 'SyntaxError') {
      markers.push({
        message: `Syntax error - ${err.message}`,
        startLineNumber: err.location.start.line,
        startColumn: err.location.start.column,
        endLineNumber: err.location.end.line,
        endColumn: err.location.end.column,
      })
    } else {
      throw err
    }
  }

  if (ambiguousNode) {
    if (!ambiguousNode?.start?.line) {
      // Bug in the AST parser, log it for now
      // eslint-disable-next-line no-console
      console.error('Ambiguous node without start line', ambiguousNode)
      return []
    }

    const line = queryPerLines[ambiguousNode.start.line - 1]

    const nbOfNegations = (line.substr(0, ambiguousNode.start.column).match(/ -/g) || []).length
    markers.push({
      message:
        'Combinaison ambigue de OR et AND (implicite ou explicite) - ajoutez des parenthèses',
      startLineNumber: ambiguousNode.start.line,
      startColumn: ambiguousNode.start.column - 3 * nbOfNegations,
      endLineNumber: ambiguousNode.end?.line,
      endColumn: ambiguousNode.end?.column - 3 * nbOfNegations,
    })
  }

  return markers
}
