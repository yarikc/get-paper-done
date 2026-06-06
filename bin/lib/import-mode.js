'use strict';

const MODES = [
  'preserve-and-strengthen',
  'generate-from-brief',
  'convert-format',
];

const transformModes = new Set(['generate-from-brief', 'convert-format']);

function stripCodeFences(markdown) {
  return String(markdown || '').replace(/```[\s\S]*?```/g, ' ');
}

function isHeading(line) {
  return /^\s{0,3}#{1,6}\s+\S/.test(line);
}

function isListLine(line) {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
}

function wordsIn(value) {
  const matches = String(value || '').match(/\b[A-Za-z][A-Za-z'-]*\b/g);
  return matches ? matches.length : 0;
}

function firstBodyParagraph(markdown) {
  const paragraphs = stripCodeFences(markdown)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !isHeading(paragraph.split(/\r?\n/)[0] || ''))
    .filter((paragraph) => !paragraph.split(/\r?\n/).every((line) => !line.trim() || isListLine(line)));
  return paragraphs[0] || '';
}

function hasThesisLikeStatement(paragraph) {
  const compact = String(paragraph || '').replace(/\s+/g, ' ').trim();
  if (!compact) return false;
  const firstSentence = compact.split(/(?<=[.!?])\s+/)[0] || compact;
  return wordsIn(firstSentence) >= 8
    && /(?:\bis\b|\bare\b|\bhas\b|\bhave\b|\bdoes\b|\bdo\b|\bshould\b|\bmust\b|\bneeds?\b|\bwill\b|\bcan\b|\bcannot\b|\bmeans\b|\bmakes?\b|\bmade\b|\bmoves?\b|\bmoved\b|\bchanges?\b|\bchanged\b|\brequires?\b|\brequired\b)/i.test(firstSentence);
}

function detectImportModeFromText(markdown) {
  const clean = stripCodeFences(markdown);
  const lines = clean.split(/\r?\n/);
  let proseWords = 0;
  let bulletWords = 0;
  let headingCount = 0;
  let nonListParagraphs = 0;

  for (const line of lines) {
    if (isHeading(line)) headingCount += 1;
    if (isListLine(line)) bulletWords += wordsIn(line);
  }

  for (const paragraph of clean.split(/\n{2,}/)) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    const paragraphLines = trimmed.split(/\r?\n/);
    if (paragraphLines.every((line) => !line.trim() || isHeading(line) || isListLine(line))) continue;
    nonListParagraphs += 1;
    proseWords += wordsIn(paragraphLines.filter((line) => !isHeading(line) && !isListLine(line)).join(' '));
  }

  const totalWords = proseWords + bulletWords;
  const proseRatio = totalWords > 0 ? proseWords / totalWords : 0;
  const thesisLike = hasThesisLikeStatement(firstBodyParagraph(markdown));
  const authoredProseDetected = (
    proseWords >= 80
    && nonListParagraphs >= 2
    && proseRatio >= 0.6
    && (thesisLike || headingCount >= 2)
  );

  return {
    detectedMode: authoredProseDetected ? 'preserve-and-strengthen' : 'generate-from-brief',
    authoredProseDetected,
    signals: {
      prose_words: proseWords,
      bullet_words: bulletWords,
      prose_ratio: Number(proseRatio.toFixed(3)),
      heading_count: headingCount,
      non_list_paragraphs: nonListParagraphs,
      thesis_like_opening: thesisLike,
    },
  };
}

function assertValidMode(mode) {
  if (mode && !MODES.includes(mode)) {
    throw new Error(`--mode must be one of: ${MODES.join(', ')}`);
  }
}

function resolveImportMode({ draftText = '', requestedMode = null, confirmTransform = false } = {}) {
  assertValidMode(requestedMode);
  const detected = detectImportModeFromText(draftText);
  const confirmedMode = requestedMode || detected.detectedMode;
  const confirmationRequired = detected.authoredProseDetected && transformModes.has(confirmedMode);

  if (confirmationRequired && !confirmTransform) {
    throw new Error([
      `Import detected authored prose and defaulted to preserve-and-strengthen.`,
      `Requested mode ${confirmedMode} can transform or regenerate the author's prose.`,
      'Rerun with --confirm-transform only if the user explicitly accepts that risk.',
    ].join(' '));
  }

  return {
    detected: detected.detectedMode,
    confirmed: confirmedMode,
    authored_prose_detected: detected.authoredProseDetected,
    confirmation_required: confirmationRequired,
    confirmation: confirmationRequired ? 'confirmed_by_flag' : 'not_required',
    signals: detected.signals,
  };
}

module.exports = {
  MODES,
  detectImportModeFromText,
  resolveImportMode,
};
