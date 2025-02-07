// TODO: how to handle ranges like 107-120? what does that even mean?
// TODO: how to distinguish from dates?
// TODO: ignore everything in parantheses?
// TODO: how to handle multiple series name slammed together? "Hello world, 13; Hello world, No. 13"

// prettier-ignore
const seriesPatterns: [RegExp, (match: RegExpExecArray) => { series: string, number: string }][] = [
  // Written-out numbers at the beginning
  [/^(?:book|volume)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+of\s+(?:the\s+)?(.*)/i,
   (m) => ({ series: m[2].trim(), number: m[1] })],

  // Year in parentheses followed by number
  [/^(.*?)\s*\((?:\d{4})\)\s*#(\d+)/,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Volume/book patterns
  [/^(.*?)(?:,?\s*|--\s*|\s+)(?:lac|n|t\.|v\.|vol\.|volume|series|book|booklet|bk\.|b\.|bd\.|nr\.|mis\.)\s*(\d+(?:\.\d+)?)/i, 
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Parentheses/bracket patterns
  [/^(.*?)\s*[\(\[]\s*(\d+(?:\.\d+)?)\s*[\)\]]/,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Hash/pound sign patterns
  [/^(.*?)(?:,?\s+|:\s+)#-?(\d+(?:\.\d+)?)/,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Ordinal patterns (including Roman numerals)
  [/^(.*?)(?:,?\s+|--\s+)(\d+(?:st|nd|rd|th|nr)|[IVXLCDM]+)$/i,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Part indicator patterns
  [/^(.*?)(?:,?\s+|:\s+|-\s+)(?:part|pt\.)\s*(\d+(?:\.\d+)?)/i,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Colon or dash followed by number
  [/^(.*?)(?::\s+|-\s+)(\d+(?:\.\d+)?)/,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Issue/number patterns
  [/^(.*?)(?:,?\s+|:\s+)(?:no\.|issue)\s*(\d+(?:\.\d+)?)/i,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Tome patterns
  [/^(.*?)(?:--\s*|,?\s+|:\s+)(?:t\.|tome)\s*(\d+(?:\.\d+)?)/i,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Written-out numbers
  [/^(.*?)(?:,?\s+|:\s+)book\s+(one|two|three|four|five|six|seven|eight|nine|ten)/i,
   (m) => ({ series: m[1].trim(), number: m[2] })],

  // Generic number pattern (last resort)
  [/^(.*\D)(\d+(?:\.\d+)?)$/,
   (m) => ({ series: m[1].trim(), number: m[2] })],
];

type Series = { name: string; position?: number }

// TODO: Ideally this supports multiple series
export function parseSeriesStrings(inputs: string[] | undefined): Series | null {
  if (!inputs || inputs.length === 0) return null
  if (inputs.length === 1) return parseSeriesString(inputs[0])

  // Often the book's position in the series will be placed in the second string
  // so we use some heurestics to guess when this is the case
  if (inputs[1].length < 8 || inputs[0].length - 6 > inputs[1].length) {
    return parseSeriesString(`${inputs[0].trim()} ${inputs[1]}`)
  }
  // Otherwise, we only parse the first string
  return parseSeriesString(inputs[0])
}

export function parseSeriesString(input: string): Series | null {
  for (const [pattern, extract] of seriesPatterns) {
    const match = pattern.exec(input)
    if (!match) continue

    const series = extract(match)
    // TODO: convert to title case
    const name = trim(series.series)
    const position =
      writtenNumberToNumber(series.number) ?? romanNumeralToNumber(series.number) ?? Number(series.number)
    if (isNaN(position)) return { name }
    return { name, position }
  }
  // No numbers so the position likely isn't in the string
  if (input.match(/^[^\d]+$/)) return { name: trim(input) }
  return null
}

/** Removes trailing punctuation, "book", and dates */
function trim(str: string): string {
  // TODO: should clean up a ton of possible endings (vol, no, nr, mis, etc.)
  return str.replace(/^\s+|([\s\[\]\(\)\-,;:.]|book|booklet|series)+$/gi, '')
}

// TODO: use a library
function writtenNumberToNumber(str: string): number | null {
  const match = str.match(
    /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)/i,
  )
  if (match) return Number(match[1])
  return null
}

function romanNumeralToNumber(roman: string): number | null {
  if (!roman.match(/[IVXLCDM]+/i)) return null

  const romanValues: { [key: string]: number } = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  }

  return roman.split('').reduce((total, currentChar, index, array) => {
    const currentValue = romanValues[currentChar]
    const nextValue = romanValues[array[index + 1]] || 0

    if (currentValue < nextValue) {
      return total - currentValue
    } else {
      return total + currentValue
    }
  }, 0)
}

// Example usage:
// const testCases = [
//   'Supplements to Vetus Testamentum -- v. 107',
//   'Library of American civilization -- LAC 10825.',
//   'FED facts ; 12',
//   'Harry Potter, #6',
//   'Nihon no meicho, 23',
//   'Kröners Taschenausgabe -- Bd.91',
//   'Texte deutscher Literatur 1500-1800',
//   'Technical report ; no. 34B',
//   'Cyfres llyfryddiaethau -- rhif 1 ; -- no.1.',
//   'On your own in the classroom -- booklet no.14',
//   'Duaḥ Be-tselem -- mis. 13',
//   'Wright American fiction -- v. 3 (1876-1900), reel S-23, no. 4911A.',
//   'Hallische Monographien -- Nr. 16',
//   'Magasin théatral -- t. 14 [no 10]',
//   'Redwall (6)',
//   'Harlequin Romance #2634',
//   'Grisha Trilogy ; book 1',
//   'Invincible #1',
//   'Lucifer (2001) #1',
//   'Harlequin Presents 1051',
//   'book two of the Riyria chronicles',
//   'Bobiverse, 1',
//   'All Souls Trilogy (Book 2)',
//   'Broken empire -- bk. 2',
//   'Chronicle of the Unhewn Throne -- book II',
//   'Silhouette Romance, 1363; Silhouette Romance, No. 1363',
//   'The Dark Tower III',
//   'Red queen -- [1]',
//   'Forgotten Realms: The Legend of Drizzt, part 7',
//   'Warriors, power of three -- [bk. 5]',
// ]
//
// testCases.forEach((test) => {
//   const result = extractSeriesInfo(test)
//   console.log(`Input: ${test}`)
//   console.log(result)
// })
