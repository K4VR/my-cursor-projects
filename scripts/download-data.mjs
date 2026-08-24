/**
 * Downloads public-domain KJV text and CC-BY cross-references,
 * normalizing them into per-book JSON for the app.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const kjvDir = join(root, 'public/data/kjv')
const xrefDir = join(root, 'public/data/crossrefs')

/** Canonical book list: slug, display name, aruljohn file, kjvstudy xref file, testament, chapters */
const BOOKS = [
  ['genesis', 'Genesis', 'Genesis', 'Genesis', 'OT', 50],
  ['exodus', 'Exodus', 'Exodus', 'Exodus', 'OT', 40],
  ['leviticus', 'Leviticus', 'Leviticus', 'Leviticus', 'OT', 27],
  ['numbers', 'Numbers', 'Numbers', 'Numbers', 'OT', 36],
  ['deuteronomy', 'Deuteronomy', 'Deuteronomy', 'Deuteronomy', 'OT', 34],
  ['joshua', 'Joshua', 'Joshua', 'Joshua', 'OT', 24],
  ['judges', 'Judges', 'Judges', 'Judges', 'OT', 21],
  ['ruth', 'Ruth', 'Ruth', 'Ruth', 'OT', 4],
  ['1-samuel', '1 Samuel', '1Samuel', '1_Samuel', 'OT', 31],
  ['2-samuel', '2 Samuel', '2Samuel', '2_Samuel', 'OT', 24],
  ['1-kings', '1 Kings', '1Kings', '1_Kings', 'OT', 22],
  ['2-kings', '2 Kings', '2Kings', '2_Kings', 'OT', 25],
  ['1-chronicles', '1 Chronicles', '1Chronicles', '1_Chronicles', 'OT', 29],
  ['2-chronicles', '2 Chronicles', '2Chronicles', '2_Chronicles', 'OT', 36],
  ['ezra', 'Ezra', 'Ezra', 'Ezra', 'OT', 10],
  ['nehemiah', 'Nehemiah', 'Nehemiah', 'Nehemiah', 'OT', 13],
  ['esther', 'Esther', 'Esther', 'Esther', 'OT', 10],
  ['job', 'Job', 'Job', 'Job', 'OT', 42],
  ['psalms', 'Psalms', 'Psalms', 'Psalms', 'OT', 150],
  ['proverbs', 'Proverbs', 'Proverbs', 'Proverbs', 'OT', 31],
  ['ecclesiastes', 'Ecclesiastes', 'Ecclesiastes', 'Ecclesiastes', 'OT', 12],
  ['song-of-solomon', 'Song of Solomon', 'SongofSolomon', 'Song_of_Solomon', 'OT', 8],
  ['isaiah', 'Isaiah', 'Isaiah', 'Isaiah', 'OT', 66],
  ['jeremiah', 'Jeremiah', 'Jeremiah', 'Jeremiah', 'OT', 52],
  ['lamentations', 'Lamentations', 'Lamentations', 'Lamentations', 'OT', 5],
  ['ezekiel', 'Ezekiel', 'Ezekiel', 'Ezekiel', 'OT', 48],
  ['daniel', 'Daniel', 'Daniel', 'Daniel', 'OT', 12],
  ['hosea', 'Hosea', 'Hosea', 'Hosea', 'OT', 14],
  ['joel', 'Joel', 'Joel', 'Joel', 'OT', 3],
  ['amos', 'Amos', 'Amos', 'Amos', 'OT', 9],
  ['obadiah', 'Obadiah', 'Obadiah', 'Obadiah', 'OT', 1],
  ['jonah', 'Jonah', 'Jonah', 'Jonah', 'OT', 4],
  ['micah', 'Micah', 'Micah', 'Micah', 'OT', 7],
  ['nahum', 'Nahum', 'Nahum', 'Nahum', 'OT', 3],
  ['habakkuk', 'Habakkuk', 'Habakkuk', 'Habakkuk', 'OT', 3],
  ['zephaniah', 'Zephaniah', 'Zephaniah', 'Zephaniah', 'OT', 3],
  ['haggai', 'Haggai', 'Haggai', 'Haggai', 'OT', 2],
  ['zechariah', 'Zechariah', 'Zechariah', 'Zechariah', 'OT', 14],
  ['malachi', 'Malachi', 'Malachi', 'Malachi', 'OT', 4],
  ['matthew', 'Matthew', 'Matthew', 'Matthew', 'NT', 28],
  ['mark', 'Mark', 'Mark', 'Mark', 'NT', 16],
  ['luke', 'Luke', 'Luke', 'Luke', 'NT', 24],
  ['john', 'John', 'John', 'John', 'NT', 21],
  ['acts', 'Acts', 'Acts', 'Acts', 'NT', 28],
  ['romans', 'Romans', 'Romans', 'Romans', 'NT', 16],
  ['1-corinthians', '1 Corinthians', '1Corinthians', '1_Corinthians', 'NT', 16],
  ['2-corinthians', '2 Corinthians', '2Corinthians', '2_Corinthians', 'NT', 13],
  ['galatians', 'Galatians', 'Galatians', 'Galatians', 'NT', 6],
  ['ephesians', 'Ephesians', 'Ephesians', 'Ephesians', 'NT', 6],
  ['philippians', 'Philippians', 'Philippians', 'Philippians', 'NT', 4],
  ['colossians', 'Colossians', 'Colossians', 'Colossians', 'NT', 4],
  ['1-thessalonians', '1 Thessalonians', '1Thessalonians', '1_Thessalonians', 'NT', 5],
  ['2-thessalonians', '2 Thessalonians', '2Thessalonians', '2_Thessalonians', 'NT', 3],
  ['1-timothy', '1 Timothy', '1Timothy', '1_Timothy', 'NT', 6],
  ['2-timothy', '2 Timothy', '2Timothy', '2_Timothy', 'NT', 4],
  ['titus', 'Titus', 'Titus', 'Titus', 'NT', 3],
  ['philemon', 'Philemon', 'Philemon', 'Philemon', 'NT', 1],
  ['hebrews', 'Hebrews', 'Hebrews', 'Hebrews', 'NT', 13],
  ['james', 'James', 'James', 'James', 'NT', 5],
  ['1-peter', '1 Peter', '1Peter', '1_Peter', 'NT', 5],
  ['2-peter', '2 Peter', '2Peter', '2_Peter', 'NT', 3],
  ['1-john', '1 John', '1John', '1_John', 'NT', 5],
  ['2-john', '2 John', '2John', '2_John', 'NT', 1],
  ['3-john', '3 John', '3John', '3_John', 'NT', 1],
  ['jude', 'Jude', 'Jude', 'Jude', 'NT', 1],
  ['revelation', 'Revelation', 'Revelation', 'Revelation', 'NT', 22],
]

const ABBR = {
  genesis: 'Gen', exodus: 'Exod', leviticus: 'Lev', numbers: 'Num', deuteronomy: 'Deut',
  joshua: 'Josh', judges: 'Judg', ruth: 'Ruth', '1-samuel': '1Sam', '2-samuel': '2Sam',
  '1-kings': '1Kgs', '2-kings': '2Kgs', '1-chronicles': '1Chr', '2-chronicles': '2Chr',
  ezra: 'Ezra', nehemiah: 'Neh', esther: 'Esth', job: 'Job', psalms: 'Ps',
  proverbs: 'Prov', ecclesiastes: 'Eccl', 'song-of-solomon': 'Song', isaiah: 'Isa',
  jeremiah: 'Jer', lamentations: 'Lam', ezekiel: 'Ezek', daniel: 'Dan', hosea: 'Hos',
  joel: 'Joel', amos: 'Amos', obadiah: 'Obad', jonah: 'Jonah', micah: 'Mic',
  nahum: 'Nah', habakkuk: 'Hab', zephaniah: 'Zeph', haggai: 'Hag', zechariah: 'Zech',
  malachi: 'Mal', matthew: 'Matt', mark: 'Mark', luke: 'Luke', john: 'John',
  acts: 'Acts', romans: 'Rom', '1-corinthians': '1Cor', '2-corinthians': '2Cor',
  galatians: 'Gal', ephesians: 'Eph', philippians: 'Phil', colossians: 'Col',
  '1-thessalonians': '1Thess', '2-thessalonians': '2Thess', '1-timothy': '1Tim',
  '2-timothy': '2Tim', titus: 'Titus', philemon: 'Phlm', hebrews: 'Heb', james: 'Jas',
  '1-peter': '1Pet', '2-peter': '2Pet', '1-john': '1John', '2-john': '2John',
  '3-john': '3John', jude: 'Jude', revelation: 'Rev',
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

function parseRef(ref) {
  // "1 John 3:16" or "Psalms 23:1" or "Song of Solomon 1:1"
  const m = String(ref).trim().match(/^(.+?)\s+(\d+):(\d+)$/)
  if (!m) return null
  const bookName = m[1]
  const book = BOOKS.find((b) => b[1].toLowerCase() === bookName.toLowerCase()
    || b[1].toLowerCase() === bookName.toLowerCase().replace(/^psalm$/, 'psalms')
    || (bookName.toLowerCase() === 'psalm' && b[0] === 'psalms')
    || (bookName.toLowerCase() === 'song of songs' && b[0] === 'song-of-solomon'))
  if (!book) return null
  return { book: book[0], chapter: Number(m[2]), verse: Number(m[3]) }
}

async function downloadKjv(slug, arulName) {
  const url = `https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${arulName}.json`
  const raw = await fetchJson(url)
  const chapters = {}
  for (const ch of raw.chapters) {
    const num = Number(ch.chapter)
    chapters[num] = ch.verses.map((v) => ({
      verse: Number(v.verse),
      text: v.text,
    }))
  }
  const out = { book: slug, chapters }
  await writeFile(join(kjvDir, `${slug}.json`), JSON.stringify(out))
}

async function downloadCrossrefs(slug, xrefName, displayName) {
  const url = `https://raw.githubusercontent.com/kennethreitz/kjvstudy.org/main/kjvstudy_org/data/cross_references/${xrefName}.json`
  let raw
  try {
    raw = await fetchJson(url)
  } catch {
    console.warn(`  skip crossrefs for ${slug}`)
    await writeFile(join(xrefDir, `${slug}.json`), '{}')
    return
  }

  const out = {}
  for (const [key, refs] of Object.entries(raw)) {
    // key like "John:1:1" or "1_John:1:1"
    const parts = key.split(':')
    if (parts.length < 3) continue
    const chapter = Number(parts[parts.length - 2])
    const verse = Number(parts[parts.length - 1])
    if (!chapter || !verse) continue
    const verseKey = `${chapter}:${verse}`
    const parsed = []
    for (const item of refs) {
      const p = parseRef(item.ref)
      if (p) parsed.push({ ...p, note: item.note || undefined })
    }
    if (parsed.length) out[verseKey] = parsed.slice(0, 12)
  }
  await writeFile(join(xrefDir, `${slug}.json`), JSON.stringify(out))
}

async function main() {
  await mkdir(kjvDir, { recursive: true })
  await mkdir(xrefDir, { recursive: true })

  const meta = BOOKS.map(([slug, name, , , testament, chapters], i) => ({
    slug,
    name,
    abbreviation: ABBR[slug],
    testament,
    chapters,
    order: i + 1,
  }))
  await writeFile(join(root, 'src/data/books.json'), JSON.stringify(meta, null, 2))

  for (const [slug, name, arul, xref] of BOOKS) {
    process.stdout.write(`${slug}... `)
    await downloadKjv(slug, arul)
    await downloadCrossrefs(slug, xref, name)
    console.log('ok')
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
