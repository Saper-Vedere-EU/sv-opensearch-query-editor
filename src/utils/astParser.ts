/* eslint-disable @typescript-eslint/no-explicit-any */
import lucene from 'lucene'

function DFS(currentNode: any): any {
  const nodes = []

  if (currentNode.left) {
    nodes.push(...DFS(currentNode.left))
  }

  nodes.push(currentNode)

  if (currentNode.right) {
    nodes.push(...DFS(currentNode.right))
  }

  return nodes
}

function translateSvToLucene(query: any) {
  // These are "quick fixes" to support some general typos or quirks present in SV data
  return query.replace(/\)-\(/g, ') -(').replace(/ -/g, ' NOT ')
}

function extractNodeLocation(ambiguousNode: any) {
  // In some edge cases with parenthesis, we might not have all the info
  // In that case, we return a default value (= the first line)

  const defaultStart = {
    offset: 1,
    line: 1,
    column: 1,
  }

  const defaultEnd = {
    offset: 1,
    line: 2,
    column: 1,
  }

  return {
    start: ambiguousNode.left?.termLocation?.end || defaultStart,
    end: ambiguousNode.right?.termLocation?.start || defaultEnd,
  }
}

export function getFirstAmbiguousNode(query: any) {
  const luceneQuery = translateSvToLucene(query)
  const ast = lucene.parse(luceneQuery)

  for (const node of DFS(ast)) {
    if (
      node.operator === 'OR' &&
      (node.right?.operator === 'AND' || node.right?.operator === '<implicit>') &&
      !node.right?.parenthesized
    ) {
      return extractNodeLocation(node.right)
    }

    if (node.operator === 'AND' && node.right?.operator === 'OR' && !node.right?.parenthesized) {
      return extractNodeLocation(node.right)
    }
  }

  return null
}
