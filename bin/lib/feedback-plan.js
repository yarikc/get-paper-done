'use strict';

const fs = require('fs');
const path = require('path');

const {
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

function fieldValue(block, field) {
  const pattern = new RegExp(`^- \\*\\*${field.replace(/[()]/g, '\\$&')}:\\*\\*\\s*(.*)$`, 'im');
  const match = block.match(pattern);
  return match ? match[1].trim() : '';
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
      recommendation: fieldValue(block, 'Recommendation'),
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
  };
}

function replaceField(block, field, value) {
  const pattern = new RegExp(`^(- \\*\\*${field.replace(/[()]/g, '\\$&')}:\\*\\*\\s*).*$`, 'im');
  if (pattern.test(block)) return block.replace(pattern, `$1${value}`);
  return `${block.trimEnd()}\n- **${field}:** ${value}\n`;
}

function updatePlanStatus(markdown) {
  const plan = parseFeedbackPlanMarkdown(markdown);
  const allDecided = plan.concerns.length > 0
    && plan.concerns.every((concern) => VALID_DECISIONS.has(String(concern.userDecision).toLowerCase()));
  const statusValue = allDecided ? 'Approved by user' : 'Pending user approval';
  return markdown.replace(/^\*\*Status:\*\*\s*.*$/im, `**Status:** ${statusValue}`);
}

function decideFeedbackPlan(input = {}) {
  const decision = String(input.decision || '').toLowerCase();
  if (!VALID_DECISIONS.has(decision)) {
    throw new Error('--decision must be one of approve, modify, defer, reject, answered_no_action');
  }
  if (!Number.isInteger(input.item) || input.item < 1) {
    throw new Error('--item must be a positive integer');
  }

  const paperState = status(input);
  const planPath = feedbackPlanPath(paperState.paperDir);
  const markdown = fs.readFileSync(planPath, 'utf8');
  const headingPattern = new RegExp(`(^###\\s+${input.item}\\.\\s+[^\\n]+\\n)`, 'm');
  const heading = markdown.match(headingPattern);
  if (!heading) throw new Error(`Feedback plan item ${input.item} was not found.`);

  const start = heading.index;
  const rest = markdown.slice(start + heading[0].length);
  const next = rest.search(/^###\s+\d+\.\s+/m);
  const end = next >= 0 ? start + heading[0].length + next : markdown.length;
  let block = markdown.slice(start, end);
  block = replaceField(block, 'User Decision', decision);
  block = replaceField(block, 'User Constraint', input.note || 'none');
  let updated = `${markdown.slice(0, start)}${block}${markdown.slice(end)}`;
  updated = updatePlanStatus(updated);
  writeFile(planPath, updated, input.dryRun);

  const parsed = parseFeedbackPlanMarkdown(updated);
  const selected = parsed.concerns.find((concern) => concern.index === input.item);
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
    console.log(`- ${concern.index}. ${concern.severity || '-'} ${concern.recommendation || '-'} [${concern.userDecision || 'pending'}] ${concern.title}`);
  }
}

function printFeedbackPlanReview(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`status: ${result.status || '-'}`);
  if (!result.concern) {
    console.log('No concerns found.');
    return;
  }
  const concern = result.concern;
  console.log('');
  console.log(`Concern ${concern.index} of ${result.total}`);
  console.log(`Type: ${concern.type}`);
  console.log(`Severity: ${concern.severity || '-'}`);
  console.log(`Recommendation: ${concern.recommendation || '-'}`);
  console.log(`Sources: ${concern.sources || '-'}`);
  console.log('');
  console.log(concern.title);
  console.log('');
  console.log('Why this matters:');
  console.log(concern.why || '-');
  console.log('');
  console.log('What improves:');
  console.log(concern.improves || '-');
  console.log('');
  console.log('Proposed handling:');
  console.log(concern.proposedHandling || '-');
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
  console.log('');
  console.log('Risk if handled badly:');
  console.log(concern.risk || '-');
  console.log('');
  console.log(`Current decision: ${concern.userDecision || 'pending'}`);
  console.log(`Current constraint: ${concern.userConstraint || 'none'}`);
  console.log('');
  console.log('Decision options:');
  console.log('- approve: accept the proposed handling as written');
  console.log('- modify: accept the concern with an added constraint or instruction');
  console.log('- defer: keep the concern for later and do not apply it in this revision');
  console.log('- reject: do not apply this concern');
  console.log('- answered_no_action: answer a question and record that no revision is needed');
  console.log('');
  console.log(`Record with: gpd feedback-plan decide --paper ${result.paperDir} --item ${concern.index} --decision <approve|modify|defer|reject|answered_no_action> --note "constraint or reason"`);
}

function printFeedbackPlanDecision(result) {
  console.log(`paper: ${result.paperDir}`);
  console.log(`feedback plan: ${result.feedbackPlanPath}`);
  console.log(`status: ${result.status}`);
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
