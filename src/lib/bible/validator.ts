import {
  BIBLE_VERSES,
  VALID_BOOKS,
  DEUTEROCANONICAL_BOOKS,
  findVerseByReference,
  type BibleVerse,
} from "./verses";

export interface VerseValidation {
  reference: string;
  isValid: boolean;
  isVerified: boolean;
  isDeuterocanonical: boolean;
  matchedVerse?: BibleVerse;
  warning?: string;
}

const VERSE_PATTERN =
  /(?:\d\s+)?(?:[A-Z][a-z]+(?:\s+of\s+[A-Z][a-z]+)?)\s+\d{1,3}:\d{1,3}(?:-\d{1,3})?/g;

export function extractVerseReferences(text: string): string[] {
  const matches = text.match(VERSE_PATTERN);
  return matches ? Array.from(new Set(matches)) : [];
}

export function isValidBookName(book: string): boolean {
  const normalized = book.trim();
  return (
    VALID_BOOKS.some((b) => b.toLowerCase() === normalized.toLowerCase()) ||
    DEUTEROCANONICAL_BOOKS.some(
      (b) => b.toLowerCase() === normalized.toLowerCase()
    )
  );
}

function isDeuterocanonicalBook(book: string): boolean {
  return DEUTEROCANONICAL_BOOKS.some(
    (b) => b.toLowerCase() === book.trim().toLowerCase()
  );
}

function parseReference(ref: string): {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
} | null {
  const match = ref
    .trim()
    .match(
      /^((?:\d\s+)?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/
    );
  if (!match) return null;
  return {
    book: match[1],
    chapter: parseInt(match[2]),
    verse: parseInt(match[3]),
    verseEnd: match[4] ? parseInt(match[4]) : undefined,
  };
}

const MAX_CHAPTERS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Psalm: 150,
  Proverbs: 31, Ecclesiastes: 12, "Song of Solomon": 8,
  Isaiah: 66, Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12,
  Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1, Jonah: 4, Micah: 7,
  Nahum: 3, Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
  Romans: 16, "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6,
  Ephesians: 6, Philippians: 4, Colossians: 4,
  "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1,
  Hebrews: 13, James: 5, "1 Peter": 5, "2 Peter": 3,
  "1 John": 5, "2 John": 1, "3 John": 1, Jude: 1, Revelation: 22,
};

export function validateVerseReference(reference: string): VerseValidation {
  const parsed = parseReference(reference);
  if (!parsed) {
    return {
      reference,
      isValid: false,
      isVerified: false,
      isDeuterocanonical: false,
      warning: `Could not parse reference format: "${reference}"`,
    };
  }

  if (!isValidBookName(parsed.book)) {
    return {
      reference,
      isValid: false,
      isVerified: false,
      isDeuterocanonical: false,
      warning: `"${parsed.book}" is not a recognized book of the Bible`,
    };
  }

  const deutero = isDeuterocanonicalBook(parsed.book);

  const maxCh = MAX_CHAPTERS[parsed.book];
  if (maxCh && parsed.chapter > maxCh) {
    return {
      reference,
      isValid: false,
      isVerified: false,
      isDeuterocanonical: deutero,
      warning: `${parsed.book} only has ${maxCh} chapters, but chapter ${parsed.chapter} was referenced`,
    };
  }

  const exactMatch = findVerseByReference(reference);
  if (exactMatch) {
    return {
      reference,
      isValid: true,
      isVerified: true,
      isDeuterocanonical: deutero,
      matchedVerse: exactMatch,
    };
  }

  return {
    reference,
    isValid: true,
    isVerified: false,
    isDeuterocanonical: deutero,
    warning: deutero
      ? "This is a Deuterocanonical reference (accepted by Catholic/Orthodox traditions, not in Protestant canon)"
      : "Reference appears structurally valid but could not be verified against our database",
  };
}

export function validateAllReferences(text: string): VerseValidation[] {
  const refs = extractVerseReferences(text);
  return refs.map(validateVerseReference);
}

export function getGroundingContext(topics: string[]): BibleVerse[] {
  const results: BibleVerse[] = [];
  const seen = new Set<string>();

  for (const topic of topics) {
    const lower = topic.toLowerCase();
    for (const verse of BIBLE_VERSES) {
      if (seen.has(verse.reference)) continue;
      if (verse.topics.some((t) => t.toLowerCase().includes(lower))) {
        results.push(verse);
        seen.add(verse.reference);
      }
    }
  }

  return results.slice(0, 10);
}
