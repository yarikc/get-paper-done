'use strict';

const fs = require('fs');
const path = require('path');

const {
  basenameLabel,
  displayPath,
  writeFile,
} = require('./common');
const {
  status,
  writeStateJson,
  writeStateMarkdown,
} = require('./state');

const VALID_DECISIONS = new Set(['approve', 'modify', 'defer', 'reject', 'answered_no_action']);

function feedbackPlanPath(paperDir) {
  return path.join(paperDir, '.paper', 'FEEDBACK-PLAN.md');
}

function oneLine(value, maxLength = 220) {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  if (!compact || compact === '-') return '-';
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function firstUseful(list) {
  return Array.isArray(list) && list.length > 0 ? list[0] : '';
}

function decisionGuidance(concern) {
  const recommendation = String(concern.recommendation || '').toLowerCase();
  if (recommendation === 'approve') {
    return 'The generated plan says to accept the proposed fix as written. Choose modify if the concern is valid but the handling needs a constraint.';
  }
  if (recommendation === 'modify') {
    return 'The generated plan says the concern is valid, but the handling needs your instruction before revision.';
  }
  if (recommendation === 'defer') {
    return 'The generated plan says this is useful but probably not for this revision.';
  }
  if (recommendation === 'reject') {
    return 'The generated plan says this should not drive a revision unless you disagree.';
  }
  return 'Choose how this concern should affect the next revision.';
}

function modifyExample() {
  return 'modify -- Accept the concern, but handle it with this constraint: <your instruction>.';
}

function fieldValue(block, field) {
  const pattern = new RegExp(`^- \\*\\*${field.replace(/[()]/g, '\\$&')}:\\*\\*\\s*(.*)$`, 'im');
  const match = block.match(pattern);
  return match ? match[1].trim() : '';
}

function fieldValueAny(block, fields) {
  for (const field of fields) {
    const value = fieldValue(block, field);
    if (value) return value;
  }
  return '';
}

function fieldList(block, field) {
  const escaped = field.replace(/[()]/g, '\\$&');
  const pattern = new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*$`, 'im');
  const match = block.match(pattern);
  if (!match) return [];

  const start = match.index + match[0].length;
  const rest = block.slice(start);
  const nextField = rest.search(/^- \*\*[^*\n]+:\*\*/m);
  const section = nextField >= 0 ? rest.slice(0, nextField) : rest;

  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^- /, '').replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

function parseConcernNumbers(value) {
  return String(value || '')
    .match(/\d+/g)
    ?.map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0) || [];
}

function tableCell(value) {
  return String(value || '-')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim() || '-';
}

function parseDecisionSetsMarkdown(markdown) {
  const sectionStart = markdown.search(/^## Decision Sets\s*$/m);
  if (sectionStart < 0) return [];
  const sectionRest = markdown.slice(sectionStart);
  const nextSection = sectionRest.slice(1).search(/\n##\s+/);
  const section = nextSection >= 0 ? sectionRest.slice(0, nextSection + 1) : sectionRest;
  const headingPattern = /^###\s+Set\s+(\d+)\s+(?:--|—)\s+([A-Z_]+)\s+(?:--|—)\s+(.+)$/gm;
  const matches = [...section.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : section.length;
    const block = section.slice(start, end);
    return {
      index: Number(match[1]),
      decision: match[2].toLowerCase(),
      title: match[3].trim(),
      covers: parseConcernNumbers(fieldValue(block, 'Covers')),
      why: fieldValue(block, 'Why'),
      instruction: fieldValue(block, 'Instruction'),
      userDecision: fieldValue(block, 'User Decision') || 'pending',
      userConstraint: fieldValue(block, 'User Constraint') || 'none yet',
    };
  });
}

function parseFeedbackPlanMarkdown(markdown) {
  const statusMatch = markdown.match(/^\*\*Status:\*\*\s*(.+)$/im);
  const createdMatch = markdown.match(/^\*\*Created:\*\*\s*(.+)$/im);
  const basedOnMatch = markdown.match(/^\*\*Based on:\*\*\s*(.+)$/im);
  const concerns = [];
  const headingPattern = /^###\s+(\d+)\.\s+([^:\n]+):\s*(.+)$/gm;
  const matches = [...markdown.matchAll(headingPattern)];

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const start = match.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
    const block = markdown.slice(start, end);
    concerns.push({
      index: Number(match[1]),
      type: match[2].trim(),
      title: match[3].trim(),
      severity: fieldValue(block, 'Severity'),
      sources: fieldValue(block, 'Source(s)'),
      recommendation: fieldValueAny(block, ['Suggested handling', 'Recommendation']),
      initialAssessment: fieldValue(block, 'Initial assessment'),
      clarificationNeeded: fieldValue(block, 'Clarification needed'),
      why: fieldValue(block, 'Why this matters'),
      improves: fieldValue(block, 'What improves if addressed'),
      risk: fieldValue(block, 'Risk if handled badly'),
      proposedHandling: fieldValue(block, 'Proposed handling'),
      proposedEdits: fieldList(block, 'Proposed edits'),
      reviewerEvidence: fieldList(block, 'Reviewer evidence'),
      affectedArtifacts: fieldValue(block, 'Affected artifacts'),
      userDecision: fieldValue(block, 'User Decision') || 'pending',
      userConstraint: fieldValue(block, 'User Constraint') || 'none yet',
    });
  }

  return {
    created: createdMatch ? createdMatch[1].trim() : '',
    basedOn: basedOnMatch ? basedOnMatch[1].trim() : '',
    status: statusMatch ? statusMatch[1].trim() : '',
    decisionSets: parseDecisionSetsMarkdown(markdown),
    concerns,
  };
}

function readFeedbackPlan(paperDir) {
  const planPath = feedbackPlanPath(paperDir);
  if (!fs.existsSync(planPath)) {
    throw new Error(`Missing feedback plan: ${planPath}`);
  }
  const markdown = fs.readFileSync(planPath, 'utf8');
  return {
    path: planPath,
    markdown,
    plan: parseFeedbackPlanMarkdown(markdown),
  };
}

function listFeedbackPlan(input = {}) {
  const paperState = status(input);
  const { path: planPath, plan } = readFeedbackPlan(paperState.paperDir);
  return {
    paperDir: paperState.paperDir,
    feedbackPlanPath: planPath,
    status: plan.status,
    concerns: plan.concerns.map((concern) => ({
      index: concern.index,
      type: concern.type,
      severity: concern.severity,
      recommendation: concern.recommendation,
      title: concern.title,
      userDecision: concern.userDecision,
      sources: concern.sources,
    })),
  };
}

function reviewFeedbackPlan(input = {}) {
  const paperState = status(input);
  const { path: planPath, plan } = readFeedbackPlan(paperState.paperDir);
  if (!input.item && plan.decisionSets.length > 0) {
    return {
      paperDir: paperState.paperDir,
      feedbackPlanPath: planPath,
      status: plan.status,
      total: plan.concerns.length,
      decisionSets: plan.decisionSets,
      concerns: plan.concerns,
      concern: null,
      full: Boolean(input.full),
    };
  }

  const concern = input.item
    ? plan.concerns.find((item) => item.index === input.item)
    : plan.concerns.find((item) => String(item.userDecision).toLowerCase() === 'pending') || plan.concerns[0];

  if (!concern) {
    return {
      paperDir: paperState.paperDir,
      feedbackPlanPath: planPath,
      status: plan.status,
      concern: null,
    };
  }

  return {
    paperDir: paperState.paperDir,
    feedbackPlanPath: planPath,
    status: plan.status,
    total: plan.concerns.length,
    concern,
    full: Boolean(input.full),
  };
}

function replaceField(block, field, value) {
  const pattern = new RegExp(`^(- \\*\\*${field.replace(/[()]/g, '\\$&')}:\\*\\*\\s*).*$`, 'im');
  if (pattern.test(block)) return block.replace(pattern, `$1${value}`);
  return `${block.trimEnd()}\n- **${field}:** ${value}\n`;
}

function renderDecisionView(plan) {
  const rows = [
    '## Decision View',
    '',
    'Review the concerns below. Use `approve`, `modify`, `defer`, or `reject` for each concern. Proposed edits are implementation options under a concern; they are not separate decisions unless listed as an unmapped suggestion.',
    '',
    '| # | Concern | Type | Severity | Recommendation | User Decision |',
    '|---|---------|------|----------|----------------|---------------|',
  ];
  for (const concern of plan.concerns) {
    rows.push(`| ${concern.index} | ${tableCell(concern.title)} | ${tableCell(concern.type)} | ${tableCell(concern.severity)} | ${tableCell(concern.recommendation)} | ${tableCell(concern.userDecision || 'pending')} |`);
  }
  return rows.join('\n');
}

function updateDecisionView(markdown) {
  const start = markdown.search(/^## Decision View\s*$/m);
  if (start < 0) return markdown;
  const rest = markdown.slice(start);
  const nextSection = rest.slice(1).search(/\n##\s+/);
  if (nextSection < 0) return markdown;
  const end = start + nextSection + 1;
  const plan = parseFeedbackPlanMarkdown(markdown);
  if (plan.concerns.length === 0) return markdown;
  return `${markdown.slice(0, start)}${renderDecisionView(plan)}\n\n${markdown.slice(end)}`;
}

function updatePlanStatus(markdown) {
  const plan = parseFeedbackPlanMarkdown(markdown);
  const allDecided = plan.concerns.length > 0
    && plan.concerns.every((concern) => VALID_DECISIONS.has(String(concern.userDecision).toLowerCase()));
  const statusValue = allDecided ? 'Approved by user' : 'Pending user approval';
  return markdown.replace(/^\*\*Status:\*\*\s*.*$/im, `**Status:** ${statusValue}`);
}

function updateDecisionSetStatuses(markdown) {
  const plan = parseFeedbackPlanMarkdown(markdown);
  if (plan.decisionSets.length === 0) return markdown;
  const decisionByConcern = new Map(plan.concerns.map((concern) => [
    concern.index,
    String(concern.userDecision || '').toLowerCase(),
  ]));
  let updated = markdown;
  for (const set of plan.decisionSets) {
    if (String(set.userDecision || '').toLowerCase() !== 'pending') continue;
    const coveredDecisions = set.covers.map((index) => decisionByConcern.get(index));
    const allCoveredDecided = coveredDecisions.length > 0
      && coveredDecisions.every((decision) => VALID_DECISIONS.has(decision));
    if (!allCoveredDecided) continue;
    const headingPattern = new RegExp(`(^###\\s+Set\\s+${set.index}\\s+(?:--|—)\\s+[^\\n]+\\n)`, 'm');
    const heading = updated.match(headingPattern);
    if (!heading) continue;
    const start = heading.index;
    const rest = updated.slice(start + heading[0].length);
    const next = rest.search(/^###\s+Set\s+\d+\s+(?:--|—)\s+/m);
    const end = next >= 0 ? start + heading[0].length + next : updated.length;
    let block = updated.slice(start, end);
    block = replaceField(block, 'User Decision', 'approve');
    updated = `${updated.slice(0, start)}${block}${updated.slice(end)}`;
  }
  return updated;
}

function replaceConcernDecision(markdown, concernIndex, decision, note) {
  const headingPattern = new RegExp(`(^###\\s+${concernIndex}\\.\\s+[^\\n]+\\n)`, 'm');
  const heading = markdown.match(headingPattern);
  if (!heading) throw new Error(`Feedback plan item ${concernIndex} was not found.`);

  const start = heading.index;
  const rest = markdown.slice(start + heading[0].length);
  const next = rest.search(/^###\s+\d+\.\s+/m);
  const end = next >= 0 ? start + heading[0].length + next : markdown.length;
  let block = markdown.slice(start, end);
  block = replaceField(block, 'User Decision', decision);
  block = replaceField(block, 'User Constraint', note || 'none');
  return `${markdown.slice(0, start)}${block}${markdown.slice(end)}`;
}

function replaceDecisionSetDecision(markdown, setIndex, decision, note) {
  const plan = parseFeedbackPlanMarkdown(markdown);
  const set = plan.decisionSets.find((item) => item.index === setIndex);
  if (!set) throw new Error(`Feedback decision set ${setIndex} was not found.`);
  if (!set.covers.length) throw new Error(`Feedback decision set ${setIndex} does not cover any concerns.`);

  const headingPattern = new RegExp(`(^###\\s+Set\\s+${setIndex}\\s+(?:--|—)\\s+[^\\n]+\\n)`, 'm');
  const heading = markdown.match(headingPattern);
  if (!heading) throw new Error(`Feedback decision set ${setIndex} was not found.`);

  const start = heading.index;
  const rest = markdown.slice(start + heading[0].length);
  const next = rest.search(/^###\s+Set\s+\d+\s+(?:--|—)\s+/m);
  const end = next >= 0 ? start + heading[0].length + next : markdown.length;
  let block = markdown.slice(start, end);
  block = replaceField(block, 'User Decision', decision);
  block = replaceField(block, 'User Constraint', note || 'none');
  let updated = `${markdown.slice(0, start)}${block}${markdown.slice(end)}`;

  const concernDecision = decision === 'approve' ? set.decision : decision;
  if (!VALID_DECISIONS.has(String(concernDecision).toLowerCase())) {
    throw new Error(`Feedback decision set ${setIndex} has unsupported set decision "${set.decision}".`);
  }

  const concernNote = note || set.instruction || 'none';
  for (const concernIndex of set.covers) {
    updated = replaceConcernDecision(updated, concernIndex, concernDecision, concernNote);
  }
  return updated;
}

function decideFeedbackPlan(input = {}) {
  const decision = String(input.decision || '').toLowerCase();
  if (!VALID_DECISIONS.has(decision)) {
    throw new Error('--decision must be one of approve, modify, defer, reject, answered_no_action');
  }
  if (!Number.isInteger(input.item) && !Number.isInteger(input.set)) {
    throw new Error('Pass --item N for one concern or --set N for one decision set.');
  }
  if (Number.isInteger(input.item) && Number.isInteger(input.set)) {
    throw new Error('Pass either --item N or --set N, not both.');
  }

  const paperState = status(input);
  const planPath = feedbackPlanPath(paperState.paperDir);
  const markdown = fs.readFileSync(planPath, 'utf8');
  let updated = Number.isInteger(input.set)
    ? replaceDecisionSetDecision(markdown, input.set, decision, input.note || '')
    : replaceConcernDecision(markdown, input.item, decision, input.note || '');
  if (!Number.isInteger(input.set)) updated = updateDecisionSetStatuses(updated);
  updated = updatePlanStatus(updated);
  updated = updateDecisionView(updated);
  writeFile(planPath, updated, input.dryRun);

  const parsed = parseFeedbackPlanMarkdown(updated);
  const selected = Number.isInteger(input.set)
    ? parsed.decisionSets.find((set) => set.index === input.set)
    : parsed.concerns.find((concern) => concern.index === input.item);
  if (parsed.status === 'Approved by user') {
    const current = status({ paper: paperState.paperDir });
    const machineState = current.machineState;
    if (machineState) {
      const nextState = {
        ...machineState,
        feedback: {
          ...(machineState.feedback || {}),
          feedback_plan_status: 'Approved by user',
          approved_handling: 'Concern decisions recorded in FEEDBACK-PLAN.md',
        },
      };
      writeStateMarkdown(paperState.paperDir, nextState, input.dryRun);
      writeStateJson(paperState.paperDir, nextState, input.dryRun);
    }
  }

  return {
    paperDir: paperState.paperDir,
    feedbackPlanPath: planPath,
    status: parsed.status,
    decision: selected,
    decisionKind: Number.isInteger(input.set) ? 'set' : 'concern',
  };
}

function printFeedbackPlanList(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`status: ${result.status || '-'}`);
  if (result.concerns.length === 0) {
    console.log('concerns: none');
    return;
  }
  console.log('concerns:');
  for (const concern of result.concerns) {
    console.log(`- ${concern.index}. ${concern.severity || '-'} suggested=${concern.recommendation || '-'} decision=${concern.userDecision || 'pending'} ${concern.title}`);
  }
}

function printFeedbackPlanReview(result) {
  console.log(result.decisionSets ? 'Feedback decision set' : 'Feedback decision');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Feedback plan: ${displayPath(result.paperDir, result.feedbackPlanPath)}`);
  console.log(`Status: ${result.status || '-'}`);
  if (result.decisionSets) {
    const approved = String(result.status || '').toLowerCase() === 'approved by user';
    console.log(`Concerns: ${result.total}`);
    console.log('');
    console.log(approved ? 'Approved decision set:' : 'Recommended decision set:');
    for (let index = 0; index < result.decisionSets.length; index += 1) {
      const group = result.decisionSets[index];
      const itemNumbers = group.covers.join(', ');
      console.log(`${index + 1}. ${group.decision.toUpperCase()} -- ${group.title}`);
      console.log(`   Covers: concerns ${itemNumbers}`);
      console.log(`   Why: ${group.why}`);
      console.log(`   Instruction: ${group.instruction}`);
      if (group.userDecision && group.userDecision !== 'pending') console.log(`   Decision: ${group.userDecision}`);
      if (result.full) {
        const covered = new Set(group.covers);
        for (const item of result.concerns.filter((concern) => covered.has(concern.index))) {
          console.log(`   - ${item.index}. ${item.title}`);
        }
      }
    }
    console.log('');
    if (approved) {
      console.log('Decision complete: this feedback plan is approved for revision.');
      console.log('Next: run /gpd-revise. The revision must apply approved/modified concerns and preserve deferred concerns unless touched incidentally.');
    } else {
      console.log('Decision needed: approve this decision set, modify the set, or review individual concerns.');
      console.log('- approve set: accept these grouped decisions and instructions');
      console.log('- modify set: provide changes to the grouped instructions');
      console.log('- review individual: rerun with --item N for any concern you want to inspect');
      console.log('');
      console.log('Next: reply with approve set, modify set, or review individual. In CLI automation, record decisions with gpd feedback-plan decide for the covered item numbers.');
    }
    console.log('More detail: rerun this command with --full.');
    return;
  }
  if (!result.concern) {
    console.log('No concerns found.');
    return;
  }
  const concern = result.concern;
  console.log('');
  console.log(`Concern ${concern.index} of ${result.total}: ${concern.title}`);
  console.log(`Severity: ${concern.severity || '-'} | Source: ${concern.sources || '-'} | Current decision: ${concern.userDecision || 'pending'}`);
  console.log(`Recommended decision: ${concern.recommendation || '-'}`);
  console.log(`Why: ${oneLine(concern.why)}`);
  console.log(`Proposed action: ${oneLine(concern.proposedHandling)}`);
  const primaryEdit = firstUseful(concern.proposedEdits);
  if (primaryEdit) console.log(`Likely edit: ${oneLine(primaryEdit)}`);
  if (concern.risk && concern.risk !== '-') console.log(`Risk if mishandled: ${oneLine(concern.risk)}`);
  if (concern.userConstraint && concern.userConstraint !== 'none yet') {
    console.log(`Current constraint: ${oneLine(concern.userConstraint)}`);
  }

  if (result.full) {
    console.log('');
    console.log('Initial assessment:');
    console.log(concern.initialAssessment || '-');
    console.log('');
    console.log('Clarification needed:');
    console.log(concern.clarificationNeeded || '-');
    console.log('');
    console.log('What improves:');
    console.log(concern.improves || '-');
    console.log('');
    console.log('Proposed edits:');
    if (concern.proposedEdits && concern.proposedEdits.length > 0) {
      for (const edit of concern.proposedEdits) console.log(`- ${edit}`);
    } else {
      console.log('-');
    }
    console.log('');
    console.log('Reviewer evidence:');
    if (concern.reviewerEvidence && concern.reviewerEvidence.length > 0) {
      for (const evidence of concern.reviewerEvidence) console.log(`- ${evidence}`);
    } else {
      console.log('-');
    }
  }

  console.log('');
  console.log(`Decision needed: do you accept this concern? ${decisionGuidance(concern)}`);
  console.log('- approve: accept the concern and proposed fix exactly as written');
  console.log('- modify: accept the concern, but provide your instruction for how to handle it');
  console.log('- defer: accept that it may be useful, but do not apply it in this revision');
  console.log('- reject: do not apply it because the concern is not valid or not relevant');
  console.log('- answered_no_action: answer a reviewer question and record that no paper change is needed');
  console.log('');
  console.log(`If you choose modify, include your handling instruction. Example: ${modifyExample()}`);
  console.log('');
  console.log(`Next: reply with approve, modify, defer, reject, or answered_no_action; or run gpd feedback-plan decide --paper ${result.paperDir} --item ${concern.index} --decision <decision> --note "constraint or reason"`);
  console.log('More detail: rerun this command with --full.');
}

function printFeedbackPlanDecision(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`status: ${result.status}`);
  if (result.decisionKind === 'set') {
    console.log(`set: ${result.decision.index}`);
    console.log(`decision: ${result.decision.userDecision}`);
    console.log(`constraint: ${result.decision.userConstraint}`);
    console.log(`covered concerns: ${result.decision.covers.join(', ')}`);
    return;
  }
  console.log(`item: ${result.decision.index}`);
  console.log(`decision: ${result.decision.userDecision}`);
  console.log(`constraint: ${result.decision.userConstraint}`);
}

module.exports = {
  decideFeedbackPlan,
  listFeedbackPlan,
  parseFeedbackPlanMarkdown,
  printFeedbackPlanDecision,
  printFeedbackPlanList,
  printFeedbackPlanReview,
  reviewFeedbackPlan,
};
