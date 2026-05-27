import {
  BIBLE_VERSES,
  VALID_BOOKS,
  DEUTEROCANONICAL_BOOKS,
  findVerseByReference,
  type BibleVerse,
} from "./verses";
import { detectMisquotation, isFakeBibleBook, type Misquotation } from "./misquotations";

// ── Types ──

export type VerseConfidence = "VERIFIED" | "STRUCTURALLY_VALID" | "UNVERIFIED" | "INVALID" | "FAKE_BOOK";

export interface VerseValidation {
  reference: string;
  confidence: VerseConfidence;
  isValid: boolean;
  isVerified: boolean;
  isDeuterocanonical: boolean;
  matchedVerse?: BibleVerse;
  warning?: string;
}

export interface GroundingResult {
  verses: BibleVerse[];
  misquotation: Misquotation | undefined;
  detectedTopics: string[];
  groundingText: string;
}

// ── Regex: handles "1 John 4:8", "Song of Solomon 2:1", "Psalm 23:1-6", etc. ──

const VERSE_PATTERN =
  /(?:(?:1|2|3|I{1,3})\s+)?(?:[A-Z][a-z]+(?:\s+of\s+[A-Z][a-z]+)?)\s+\d{1,3}:\d{1,3}(?:\s*-\s*\d{1,3})?/g;

export function extractVerseReferences(text: string): string[] {
  const matches = text.match(VERSE_PATTERN);
  if (!matches) return [];
  const cleaned = matches.map((m) => m.replace(/\s+/g, " ").trim());
  return Array.from(new Set(cleaned));
}

// ── Book validation ──

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

// ── Reference parsing ──

function parseReference(ref: string): {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
} | null {
  const match = ref
    .trim()
    .match(
      /^((?:(?:1|2|3|I{1,3})\s+)?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d{1,3}):(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/
    );
  if (!match) return null;
  return {
    book: match[1],
    chapter: parseInt(match[2]),
    verse: parseInt(match[3]),
    verseEnd: match[4] ? parseInt(match[4]) : undefined,
  };
}

// ── Chapter limits for every canonical book ──

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

// ── Single-verse validation with confidence scoring ──

export function validateVerseReference(reference: string): VerseValidation {
  const parsed = parseReference(reference);
  if (!parsed) {
    return {
      reference,
      confidence: "INVALID",
      isValid: false,
      isVerified: false,
      isDeuterocanonical: false,
      warning: `Could not parse reference format: "${reference}"`,
    };
  }

  if (isFakeBibleBook(parsed.book)) {
    return {
      reference,
      confidence: "FAKE_BOOK",
      isValid: false,
      isVerified: false,
      isDeuterocanonical: false,
      warning: `"${parsed.book}" is not a book of the Bible — it appears to be a fabricated reference`,
    };
  }

  if (!isValidBookName(parsed.book)) {
    return {
      reference,
      confidence: "INVALID",
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
      confidence: "INVALID",
      isValid: false,
      isVerified: false,
      isDeuterocanonical: deutero,
      warning: `${parsed.book} has ${maxCh} chapters; chapter ${parsed.chapter} does not exist`,
    };
  }

  if (parsed.verseEnd && parsed.verseEnd <= parsed.verse) {
    return {
      reference,
      confidence: "INVALID",
      isValid: false,
      isVerified: false,
      isDeuterocanonical: deutero,
      warning: `Invalid verse range: verse ${parsed.verseEnd} is not greater than verse ${parsed.verse}`,
    };
  }

  const exactMatch = findVerseByReference(reference);
  if (exactMatch) {
    return {
      reference,
      confidence: "VERIFIED",
      isValid: true,
      isVerified: true,
      isDeuterocanonical: deutero,
      matchedVerse: exactMatch,
    };
  }

  return {
    reference,
    confidence: deutero ? "UNVERIFIED" : "STRUCTURALLY_VALID",
    isValid: true,
    isVerified: false,
    isDeuterocanonical: deutero,
    warning: deutero
      ? "Deuterocanonical reference (Catholic/Orthodox canon); could not verify exact text"
      : "Reference is structurally valid but not in our verified database — use with caution",
  };
}

// ── Bulk validation ──

export function validateAllReferences(text: string): VerseValidation[] {
  const refs = extractVerseReferences(text);
  return refs.map(validateVerseReference);
}

// ── Grounding context retrieval ──

const TOPIC_MAP: Record<string, string[]> = {
  love: ["love", "God's love", "charity", "greatest commandment"],
  faith: ["faith", "belief", "trust"],
  hope: ["hope", "future", "comfort"],
  salvation: ["salvation", "eternal life", "saved", "redemption"],
  grace: ["grace", "mercy", "gift"],
  sin: ["sin", "humanity", "repentance"],
  forgiveness: ["forgiveness", "cleansing", "confession"],
  prayer: ["prayer", "asking", "seeking"],
  healing: ["healing", "comfort", "restoration"],
  comfort: ["comfort", "peace", "rest", "brokenness"],
  strength: ["strength", "courage", "power", "endurance"],
  wisdom: ["wisdom", "guidance", "understanding"],
  peace: ["peace", "rest", "anxiety"],
  fear: ["fear", "courage", "God's presence"],
  death: ["death", "resurrection", "eternal life", "heaven"],
  resurrection: ["resurrection", "eternal life", "Easter"],
  heaven: ["heaven", "eternal life", "new creation"],
  hell: ["judgment", "condemnation"],
  creation: ["creation", "beginning", "image of God"],
  jesus: ["Jesus", "Christ", "messiah", "incarnation", "divinity"],
  god: ["God", "name of God", "nature of God"],
  "holy spirit": ["Holy Spirit", "Spirit", "fruit of the Spirit"],
  trinity: ["Trinity", "Father", "Son", "Holy Spirit"],
  baptism: ["baptism"],
  communion: ["communion", "Lord's Supper"],
  marriage: ["marriage", "love"],
  suffering: ["suffering", "trials", "tribulation", "comfort"],
  joy: ["joy", "rejoice"],
  trust: ["trust", "faith", "refuge"],
  courage: ["courage", "strength", "fear"],
  mercy: ["mercy", "compassion", "grace"],
  justice: ["justice", "righteousness"],
  humility: ["humility", "selflessness"],
  patience: ["patience", "endurance", "longsuffering"],
  kindness: ["kindness", "compassion", "forgiveness"],
  anxiety: ["anxiety", "peace", "care", "worry"],
  identity: ["identity", "image of God", "new creation", "self-worth"],
  worship: ["worship", "praise"],
  prophecy: ["prophecy", "messiah"],
  "spiritual warfare": ["armor of God", "spiritual warfare", "devil"],
  "fruit of the spirit": ["fruit of the Spirit", "character"],
  purpose: ["purpose", "God's plan", "calling"],
  temptation: ["temptation", "endurance"],
  commandments: ["commandments", "law", "greatest commandment"],
};

export function getGroundingContext(topics: string[]): BibleVerse[] {
  const results: BibleVerse[] = [];
  const seen = new Set<string>();

  for (const topic of topics) {
    const expandedTopics = TOPIC_MAP[topic.toLowerCase()] || [topic];
    for (const expanded of expandedTopics) {
      const lower = expanded.toLowerCase();
      for (const verse of BIBLE_VERSES) {
        if (seen.has(verse.reference)) continue;
        if (verse.topics.some((t) => t.toLowerCase().includes(lower))) {
          results.push(verse);
          seen.add(verse.reference);
        }
      }
    }
  }

  return results.slice(0, 10);
}

// ── Full grounding pipeline ──

export function buildGroundingResult(userInput: string): GroundingResult {
  const input = userInput.toLowerCase();

  const directMatches: BibleVerse[] = [];
  for (const verse of BIBLE_VERSES) {
    if (
      verse.text.toLowerCase().includes(input.substring(0, 30)) ||
      verse.reference.toLowerCase().includes(input.substring(0, 20))
    ) {
      directMatches.push(verse);
    }
  }

  const allTopicKeys = Object.keys(TOPIC_MAP);
  const detectedTopics = allTopicKeys.filter((t) => input.includes(t));

  const topicVerses =
    detectedTopics.length > 0 ? getGroundingContext(detectedTopics) : [];

  const misquotation = detectMisquotation(userInput);

  const seen = new Set<string>();
  const allVerses = [...directMatches, ...topicVerses].filter((v) => {
    if (seen.has(v.reference)) return false;
    seen.add(v.reference);
    return true;
  });

  const limited = allVerses.slice(0, 8);

  let groundingText = "";

  if (limited.length > 0) {
    const verseLines = limited
      .map((v) => `  [VERIFIED] ${v.reference}: "${v.text}"`)
      .join("\n");
    groundingText += `\n\n## Verified Scripture for Grounding\nThe following verses have been retrieved from a verified KJV database. You MAY quote these exactly as written. Cite the reference with each quote.\n${verseLines}`;
  }

  if (misquotation) {
    groundingText += `\n\n## Misquotation Alert\nThe user may be referencing: "${misquotation.fake_quote}"\nThis is NOT a Bible verse. Actual source: ${misquotation.actual_source}\nCorrection: ${misquotation.correction}\nRelated real verses: ${misquotation.related_verses.join(", ")}`;
  }

  groundingText +=
    "\n\n## Citation Rules\n" +
    "- ONLY quote verses marked [VERIFIED] above using their exact text.\n" +
    "- For any OTHER verse you want to reference, paraphrase with: 'Scripture teaches that...' or 'The Bible speaks of...'\n" +
    "- NEVER fabricate verse text. If unsure, say 'I'd encourage you to look up [Book Chapter:Verse] for more on this.'\n" +
    "- Mark each citation with (KJV) to indicate the translation.";

  return {
    verses: limited,
    misquotation,
    detectedTopics,
    groundingText,
  };
}
