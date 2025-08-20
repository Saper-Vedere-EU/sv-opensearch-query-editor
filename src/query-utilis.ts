/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { prettify } from 'prettier-elastic-query';

export function tweetIsRT(text: string) {
  const firstWord = text.split(' ')[0]
  if (firstWord === 'RT') return true
  else return false
}

export function extractLink(text: string) {
  const regex = /([^\S]|^)(((https?:\/\/)|(www\.))(\S+))/gi
  return (text || '').replace(regex, function (match, space, url) {
    let hyperlink = url
    if (!hyperlink.match('^https?://')) {
      hyperlink = 'http://' + hyperlink
    }
    return space + `<a href="${hyperlink}" target="_blank">${hyperlink}</a>`
  })
}

export function numberRounded(num: number) {
  if (num < 1000) return num
  if (num < 1000 * 1000) return Math.round((num / 1000) * 10) / 10 + 'K'
  if (num < 1000 * 1000 * 1000) return Math.round((num / 1000 / 1000) * 10) / 10 + 'M'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getColorType(color: any) {
  let r, g, b
  if (color.match(/^rgb/)) {
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/)
    r = color[1]
    g = color[2]
    b = color[3]
  } else {
    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'))

    r = color >> 16
    g = (color >> 8) & 255
    b = color & 255
  }
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
  if (hsp > 127.5) {
    return 'black'
  } else {
    return 'white'
  }
}

/* ------------------------------------------------------------------------------------------------------------------ */
/* Query regex utils
/* ------------------------------------------------------------------------------------------------------------------ */
export const ELASTICSEARCH_KEYWORDS = [
  'and',
  'And',
  'ANd',
  'AnD',
  'aNd',
  'aND',
  'anD',
  'or',
  'Or',
  'oR',
  'AND',
  'OR',
  // 'not',
  // 'Not',
  // 'NOt',
  // 'NoT',
  // 'nOt',
  // 'nOT',
  // 'noT',
  // 'to',
  // 'To',
  // 'tO',
  // 'NOT',
  // 'TO'
]

export function validateQueryRegex(query: string) {
  const querySanitized = sanitizeQuery(query)
  const parensObj = getMappingParens(querySanitized)
  const opsObj = getMappingOperators(querySanitized)
  const parensMap = parensObj['mappings']
  const errorOps = ELASTICSEARCH_KEYWORDS.filter((ops) => !['AND', 'OR', 'NOT', 'TO'].includes(ops))
  const errorOpsRegex = new RegExp(`\\b(${errorOps.join('|')})\\b`, 'g')
  const correctOR = /\b(OR)\b/g
  const correctAND = /\b(AND)\b/g
  const errors: string[] = parensObj['errors'].concat(opsObj['errors'])
  if (!query)
    errors.push(
      'Erreur de syntaxe <span style="color:black">-> query is empty, please write something</span>',
    )
  const queryArray = querySanitized.split('')
  // const correctOpsRegex = /\b(AND|OR|NOT|TO)\b/g;
  // const esError = getESqueryError(querySanitized);
  // if (!errors.length && esError) errors.push(esError);
  Object.entries(parensMap).forEach(([key, value]) => {
    const start = parseInt(key, 10)
    const end = parseInt(value as string, 10)
    if (start < 0) {
      queryArray[end] = '<span style="color:red;font-weight:bold;">)</span>'
    }
    if (end < 0) {
      queryArray[start] = '<span style="color:red;font-weight:bold;">(</span>'
    }
    if (start >= 0 && end > 0) {
      if (
        !queryArray
          .slice(start + 1, end)
          .join('')
          .trim()
      ) {
        queryArray[start] = '<span style="color:red;font-weight:bold;">(</span>'
        queryArray[end] = '<span style="color:red;font-weight:bold;">)</span>'
        errors.push(
          'Erreur de syntaxe <span style="color:black">-> parentheses are empty, please write something</span>',
        )
      } else {
        queryArray[start] = '<span style="color:#CE4AFF;font-weight:500;">(</span>'
        queryArray[end] = '<span style="color:#CE4AFF;font-weight:500;">)</span>'
      }
    }
  })
  const formattedQuery = queryArray
    .join('')
    // .replaceAll(correctOpsRegex, (match) => `<span style="color:#129836;font-weight:500;">${match}</span>`)
    .replaceAll(
      correctOR,
      (match) => `<span style="color:#3457B5;font-weight:500;">${match}</span>`,
    )
    .replaceAll(
      correctAND,
      (match) => `<span style="color:#129836;font-weight:500;">${match}</span>`,
    )
    .replaceAll(
      errorOpsRegex,
      (match) =>
        `<span style="color:red;font-weight:bold;text-decoration:underline">${match}</span>`,
    )
  return {
    query: formattedQuery,
    errors,
  }
}

export function highlightQueryRegex(query: string, pos: string) {
  const errorOps = ELASTICSEARCH_KEYWORDS.filter((ops) => !['AND', 'OR', 'NOT', 'TO'].includes(ops))
  const errorOpsRegex = new RegExp(`\\b(${errorOps.join('|')})\\b`, 'g')
  // const correctOpsRegex = /\b(AND|OR|NOT|TO)\b/g;
  const correctOR = /\b(OR)\b/g
  const correctAND = /\b(AND)\b/g
  const querySanitized = sanitizeQuery(query)
  const c = querySanitized.charAt(parseInt(pos, 10))
  let start: number = 0
  let end: number = 0
  let style: string = ''
  let queryOut = ''
  if (c === '' || (c !== '(' && c !== ')')) return null
  const parensMap = getMappingParens(querySanitized)['mappings']
  const parensMapSwap = Object.fromEntries(
    Object.entries(parensMap).map(([key, value]) => [value, key]),
  )
  if (c === '(') {
    start = parseInt(pos, 10)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    end = parseInt((parensMap as any)[pos], 10)
  } else if (c === ')') {
    start = parseInt(parensMapSwap[pos], 10)
    end = parseInt(pos, 10)
  }
  if (end && start && start < 0) {
    start = 0
    style = 'display:inline-box; background-color:#fcd6d6;'
    queryOut += `<span style="${style}">${querySanitized.substring(start, end)}</span>`
    queryOut += '<span style="color:red;font-weight:bold;">)</span>'
  } else if (start && end && end < 0) {
    end = querySanitized.length
    style = 'display:inline-box; background-color:#fcd6d6;'
    queryOut += '<span style="color:red;font-weight:bold;">(</span>'
    queryOut += `<span style="${style}">${querySanitized.substring(start + 1, end)}</span>`
  } else if (start && end && !querySanitized.slice(start + 1, end).trim()) {
    style = 'display:inline-box;background-color:#D5E5FD;'
    queryOut += '<span style="color:red;font-weight:bold;">(</span>'
    queryOut += `<span style="${style}">${querySanitized.substring(start + 1, end)}</span>`
    queryOut += '<span style="color:red;font-weight:bold;">)</span>'
  } else {
    style = 'display:inline-box;background-color:#D5E5FD;'
    queryOut += '<span style="color:#CE4AFF;">(</span>'
    queryOut += `<span style="${style}">${querySanitized.substring(start + 1, end)}</span>`
    queryOut += '<span style="color:#CE4AFF">)</span>'
  }
  queryOut =
    querySanitized.substring(0, start) +
    queryOut
      // .replaceAll(correctOpsRegex, (match) => `<span style="color:#129836;;">${match}</span>`)
      .replaceAll(correctOR, (match) => `<span style="color:#3457B5;;">${match}</span>`)
      .replaceAll(correctAND, (match) => `<span style="color:#129836;;">${match}</span>`)
      .replaceAll(
        errorOpsRegex,
        (match) => `<span style="color:red;font-weight:bold;">${match}</span>`,
      ) +
    querySanitized.substring(end + 1, querySanitized.length)
  return queryOut
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCaretPos(event: any) {
  const tag = event.target?.tagName?.toLowerCase()
  const inputTags = ['input', 'textarea']
  let pos = 0
  if (inputTags.includes(tag)) {
    const $el = event.target
    if ($el.selectionStart || $el.selectionStart === '0') {
      pos = $el.selectionStart
    }
  } else {
    const $el = document.getSelection()
    if ($el) {
      $el.modify('extend', 'backward', 'paragraphboundary')
      pos = $el.toString().length
      if ($el.anchorNode !== undefined) {
        $el.collapseToEnd()
      }
    }
  }
  return pos
}

export function getMappingParens(text: string) {
  const openers = {
    '(': ')',
  }
  const closers = {
    ')': '(',
  }
  const parensRegex = new RegExp(`(\\(|\\))`, 'g')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stack: any[] = []
  const out = {
    mappings: {},
    errors: [],
  }
  Array.from(text.matchAll(parensRegex)).forEach((matchArray) => {
    const c = matchArray[1]
    const i = matchArray['index']
    if (c in openers) {
      stack.push([c, i])
      ;(out.mappings as any)[`${i}`] = -1
    } else if (c in closers) {
      if (!stack.length) {
        const slice = text.slice(0, i + 1).split(' ')
        let substr = ''
        if (slice && Array.isArray(slice) && slice.length > 1) {
          const pop = slice.pop()
          if (pop) {
            substr = pop.trim()
          }
        }
        substr = substr.trim()
        ;(out['mappings'] as any)[`${-i}`] = i
        // out['errors'].push(`ParensError: col ${i + 1} -> expected '(' at the begining of ${substr}`);
        ;(out['errors'] as any).push(
          `Erreur de parenthèses <span style="color:black">-> expected '(' at the begining of ${substr}</span>`,
        )
      } else {
        const [pair, idx] = stack.pop()
        if (pair !== (closers as any)[c]) {
          // out['errors'].push(`ParensError: col ${i + 1} -> mismatched parenthesis`);
          ;(out['errors'] as any).push(
            `Erreur de parenthèses <span style="color:black">-> mismatched parenthesis</span>`,
          )
        }
        ;(out['mappings'] as any)[`${idx}`] = i
      }
    }
  })
  Object.entries(out['mappings'])
    .filter(([_, value]) => (value as number) < 0)
    .forEach((item) => {
      const i = parseInt(item[0], 10)
      const split = text.slice(i).split(' ')
      let substr = ''
      if (split && Array.isArray(split) && split.length > 1) {
        const shift = split.shift()
        if (shift) {
          substr = shift.trim()
        }
      }

      // out['errors'].push(`ParensError: col ${i + 1} -> expected ')' at the end of ${substr}`);
      ;(out['errors'] as any).push(
        `Erreur de parenthèses <span style="color:black">-> expected ')' at the end of ${substr}</span>`,
      )
    })
  return out
}

export function getMappingOperators(text: string) {
  const opsRegex = new RegExp(`\\s(${ELASTICSEARCH_KEYWORDS.join('|')})\\s`, 'g')
  const out = {
    mappings: {},
    errors: [],
  }
  Array.from(text.matchAll(opsRegex)).forEach((matchArray) => {
    const word = matchArray[1].trim()
    const i = matchArray['index'] + 1
    const uppercase = word === word.toUpperCase()
    if (!uppercase) {
      // out['errors'].push(`OpsError: col ${i + 1} -> operator '${word}' is not uppercase`);
      ;(out.errors as any).push(
        `Erreur d'opérateur <span style="color:black">-> operator '${word}' is not uppercase</span>`,
      )
    }
    ;(out.mappings as any)[`${i}`] = {
      ops: word,
      uppercase,
    }
  })
  return out
}

// export function getESqueryError(query) {
//   let queryError = null;
//   try {
//     if (!query) throw new Error('SyntaxError: query is empty, please write something');
//     prettify(query);
//   } catch (error) {
//     let e = 'SyntaxError: invalid query, please check your syntax';
//     if (error?.shortMessage) {
//       const pos = parseInt(error.shortMessage.split(':', 1)[0].split('col').slice(-1).join('').trim(), 10);
//       const summary = error.shortMessage
//         .toLowerCase()
//         .replace(':', '->')
//         .replace(/^line \d+,?/, '')
//         .trim();
//       const desc = query
//         .slice(pos - 10, pos + 10)
//         .trim()
//         .split(/\s+/)
//         .slice(-3)
//         .join(' ')
//         .trim();
//       e = `${summary} ${desc}`;
//     } else {
//       e = error?.message ?? e;
//     }
//     queryError = `EsError: ${e}`;
//   }
//   return queryError;
// }

export function sanitizeQuery(query: string) {
  const s = query ?? ''
  return s
    .normalize('NFKC')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\xa0\u200e\n\r\t\f]/g, ' ')
    .replace(/\s\s+/g, ' ')
    .trim()
}
