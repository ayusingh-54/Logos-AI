export interface Misquotation {
  fake_quote: string;
  actual_source: string;
  correction: string;
  related_verses: string[];
}

export const COMMON_MISQUOTATIONS: Misquotation[] = [
  {
    fake_quote: "God helps those who help themselves",
    actual_source: "Benjamin Franklin (Poor Richard's Almanack, 1736)",
    correction:
      "This is not found anywhere in the Bible. In fact, Scripture teaches the opposite — God helps the helpless. The biblical emphasis is on God's grace toward those who cannot save themselves.",
    related_verses: [
      "Psalm 46:1",
      "Isaiah 41:10",
      "Romans 5:8",
      "Ephesians 2:8-9",
    ],
  },
  {
    fake_quote: "Cleanliness is next to godliness",
    actual_source: "John Wesley (sermon, 1778); also attributed to Francis Bacon",
    correction:
      "This phrase does not appear in Scripture. While the Old Testament contains ceremonial cleanliness laws in Leviticus, the concept of physical cleanliness equaling spiritual purity is not a biblical teaching.",
    related_verses: ["Psalm 51:10", "Matthew 23:25-26"],
  },
  {
    fake_quote: "Money is the root of all evil",
    actual_source:
      "Misquotation of 1 Timothy 6:10. The actual verse says 'the LOVE of money is the root of all evil' — the love of money, not money itself.",
    correction:
      'The actual text is: "For the love of money is the root of all evil" (1 Timothy 6:10, KJV). The distinction is crucial — Scripture does not condemn wealth itself, but the idolatrous pursuit of it.',
    related_verses: [
      "1 Timothy 6:10",
      "Matthew 6:24",
      "Ecclesiastes 5:10",
    ],
  },
  {
    fake_quote: "This too shall pass",
    actual_source:
      "Persian Sufi poets; popularized by Abraham Lincoln. Not found in Scripture.",
    correction:
      "While this is a comforting sentiment, it is not a Bible verse. Scripture does offer comfort in trials through passages like James 1:2-3 and 2 Corinthians 4:17.",
    related_verses: ["James 1:2-3", "2 Corinthians 4:17", "Psalm 30:5"],
  },
  {
    fake_quote: "God works in mysterious ways",
    actual_source:
      'William Cowper (hymn "God Moves in a Mysterious Way," 1774). Not a direct Bible quote.',
    correction:
      "While the hymn is beloved, the phrase itself is not in Scripture. The Bible does speak of God's ways being higher than ours in Isaiah 55:8-9.",
    related_verses: ["Isaiah 55:8-9", "Romans 11:33", "Job 42:3"],
  },
  {
    fake_quote: "Spare the rod, spoil the child",
    actual_source:
      'Samuel Butler (poem "Hudibras," 1664). Often conflated with Proverbs 13:24.',
    correction:
      "The exact phrase is not in the Bible. Proverbs 13:24 says 'He that spareth his rod hateth his son: but he that loveth him chasteneth him betimes.' The interpretation and application of this passage is debated among scholars.",
    related_verses: ["Proverbs 13:24", "Proverbs 22:6", "Ephesians 6:4"],
  },
  {
    fake_quote: "God never gives you more than you can handle",
    actual_source:
      "Misinterpretation of 1 Corinthians 10:13. That verse speaks specifically about temptation, not suffering in general.",
    correction:
      "1 Corinthians 10:13 is about temptation — God provides a way out of temptation. It does not promise that life's suffering will never exceed our capacity. Paul himself wrote of being 'pressed beyond measure' in 2 Corinthians 1:8.",
    related_verses: [
      "1 Corinthians 10:13",
      "2 Corinthians 1:8-9",
      "2 Corinthians 12:9",
    ],
  },
  {
    fake_quote: "When God closes a door, He opens a window",
    actual_source: 'The Sound of Music (1965 film). Not a biblical teaching.',
    correction:
      "This quote comes from the movie The Sound of Music, not from Scripture. While God does guide our paths (Proverbs 3:5-6), the Bible does not promise convenient alternatives to every closed door.",
    related_verses: [
      "Proverbs 3:5-6",
      "Jeremiah 29:11",
      "Romans 8:28",
    ],
  },
  {
    fake_quote: "To thine own self be true",
    actual_source:
      "Shakespeare (Hamlet, Act 1, Scene 3). Not a biblical principle.",
    correction:
      "This is from Shakespeare's Hamlet, spoken by Polonius. Biblical self-understanding is quite different — Scripture calls believers to deny themselves (Luke 9:23) and find their identity in Christ (Galatians 2:20).",
    related_verses: ["Luke 9:23", "Galatians 2:20", "Philippians 2:3-4"],
  },
  {
    fake_quote: "The lion shall lay down with the lamb",
    actual_source:
      "Misquotation of Isaiah 11:6. The actual verse says 'the wolf also shall dwell with the lamb' — wolf, not lion.",
    correction:
      'The actual text is: "The wolf also shall dwell with the lamb, and the leopard shall lie down with the kid" (Isaiah 11:6). Lions are mentioned later in the passage: "and the calf and the young lion and the fatling together."',
    related_verses: ["Isaiah 11:6", "Isaiah 65:25"],
  },
  {
    fake_quote: "Hate the sin, love the sinner",
    actual_source:
      'Often attributed to Augustine but actually from Gandhi\'s 1929 autobiography. Augustine wrote something similar but different in Latin: "cum dilectione hominum et odio vitiorum."',
    correction:
      "This exact phrase is not in the Bible. The biblical call is to love one another (John 13:34-35) while acknowledging the reality of sin. However, the way this phrase is often applied can be problematic — Jesus's approach was typically to engage sinners with unconditional love first.",
    related_verses: [
      "John 13:34-35",
      "Romans 5:8",
      "John 8:11",
      "Matthew 7:1-5",
    ],
  },
];

export const FAKE_BIBLE_BOOKS = [
  "Hezekiah", "Nebuchadnezzar", "Disciples", "Apostles",
  "Nazareth", "Bethlehem", "Calvary", "Gethsemane",
  "Opinions", "Corrections", "Hesitations", "Contradictions",
  "Prosperity", "Blessings", "Miracles", "Visions",
  "Paul's Letter to the Americans",
];

export function detectMisquotation(
  text: string
): Misquotation | undefined {
  const lower = text.toLowerCase();
  return COMMON_MISQUOTATIONS.find((m) => {
    const fakeWords = m.fake_quote.toLowerCase().split(/\s+/);
    const matchCount = fakeWords.filter((w) => lower.includes(w)).length;
    return matchCount >= fakeWords.length * 0.6;
  });
}

export function isFakeBibleBook(bookName: string): boolean {
  return FAKE_BIBLE_BOOKS.some(
    (fb) => fb.toLowerCase() === bookName.trim().toLowerCase()
  );
}
