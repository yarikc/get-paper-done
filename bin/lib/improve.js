'use strict';

const fs = require('fs');
const path = require('path');

const {
  basenameLabel,
} = require('./common');
const {
  status,
} = require('./state');

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function preferredAcceptSource(paperDir) {
  const meta = path.join(paperDir, '.paper');
  if (fs.existsSync(path.join(meta, 'exports', 'FINAL.md'))) return 'final';
  return 'draft';
}

function readChangeSetDetails(paperDir) {
  const report = readJsonIfExists(path.join(paperDir, '.paper', 'CHANGESET.json'));
  if (!report) return null;
  const metrics = report.metrics || {};
  const removedHeadings = Array.isArray(metrics.removed_headings) ? metrics.removed_headings : [];
  const renamedHeadings = Array.isArray(metrics.renamed_headings) ? metrics.renamed_headings : [];
  const advisoryFindings = Array.isArray(report.advisory_findings) ? report.advisory_findings : [];
  return {
    removed_heading_count: removedHeadings.length,
    renamed_heading_count: renamedHeadings.length,
    added_heading_count: Array.isArray(metrics.added_headings) ? metrics.added_headings.length : 0,
    removed_headings: removedHeadings,
    renamed_headings: renamedHeadings,
    advisory_categories: [...new Set(advisoryFindings.map((finding) => finding.category).filter(Boolean))],
  };
}

function improvePaper(input = {}) {
  const state = status(input);
  const paperDir = state.paperDir;
  const accepted = state.acceptedSummary || { exists: false };
  const changeSet = state.changeSetSummary || { exists: false, current: false };
  const changeSetDetails = changeSet.exists ? readChangeSetDetails(paperDir) : null;
  const paperArg = `--paper ${paperDir}`;

  if (!accepted.exists) {
    const source = preferredAcceptSource(paperDir);
    return {
      paperDir,
      stage: 'needs_accepted_baseline',
      stage_label: 'needs accepted baseline',
      accepted,
      changeSet,
      changeSetDetails,
      next_action: `run gpd accept ${paperArg} --source ${source}`,
      next_command: `gpd accept ${paperArg} --source ${source}`,
      recommendation: 'Read the current paper and promote it only if this is the human-approved baseline.',
      why: 'GPD cannot protect authored prose until there is a sovereign accepted baseline to compare against.',
    };
  }

  if (accepted.draft_status_since_accept === 'draft changed since accept') {
    if (!changeSet.exists || !changeSet.current) {
      return {
        paperDir,
        stage: 'needs_compare',
        stage_label: 'needs compare',
        accepted,
        changeSet,
        changeSetDetails,
        next_action: `run gpd compare ${paperArg}`,
        next_command: `gpd compare ${paperArg}`,
        recommendation: 'Generate the baseline-aware change report before accepting, revising, or exporting this candidate.',
        why: changeSet.exists
          ? 'The existing CHANGESET is stale for the current accepted baseline or draft candidate.'
          : 'The draft changed after acceptance and no CHANGESET exists for this candidate.',
      };
    }

    const pairwise = changeSet.pairwise || 'unknown';
    const risk = pairwise === 'regression_risk';
    const changeSetPath = path.join(paperDir, '.paper', 'CHANGESET.md');
    return {
      paperDir,
      stage: 'review_change_set',
      stage_label: 'review change set',
      accepted,
      changeSet,
      changeSetDetails,
      next_action: `review ${changeSetPath}`,
      next_command: '',
      recommendation: risk
        ? 'Do not accept yet. Review the regression risks, revise the candidate against the accepted baseline, then rerun gpd compare.'
        : 'Review CHANGESET.md. If the candidate is genuinely better, run gpd accept; otherwise revise DRAFT.md and rerun gpd compare.',
      why: 'GPD has surfaced the candidate-vs-baseline differences, but it cannot declare the prose better without author review.',
    };
  }

  return {
    paperDir,
    stage: 'accepted_current',
    stage_label: 'accepted current',
    accepted,
    changeSet,
    changeSetDetails,
    next_action: 'run gpd status when you need the current workspace state',
    next_command: 'gpd status',
    recommendation: 'No candidate change is pending. Start a targeted edit from the accepted baseline before running compare.',
    why: 'DRAFT.md has not changed since the accepted baseline was recorded.',
  };
}

function printImprove(result) {
  const changeSet = result.changeSet || {};
  const details = result.changeSetDetails || {};
  console.log('Improve');
  console.log('');
  console.log(`Paper: ${basenameLabel(result.paperDir)}`);
  console.log(`Stage: ${result.stage_label}`);
  console.log(`Accepted baseline: ${result.accepted && result.accepted.exists ? result.accepted.accepted_path : 'none'}`);
  if (result.accepted && result.accepted.exists) {
    console.log(`Candidate: ${result.accepted.draft_status_since_accept}`);
  }
  if (changeSet.exists) {
    console.log(`Compare: ${changeSet.label}; spans ${changeSet.changed_span_count}; advisories ${changeSet.advisory_count}; word delta ${changeSet.word_count_delta}`);
    if (details.removed_heading_count || details.renamed_heading_count || details.added_heading_count) {
      console.log(`Structure: removed ${details.removed_heading_count || 0}; renamed ${details.renamed_heading_count || 0}; added ${details.added_heading_count || 0}`);
    }
    if (Array.isArray(details.advisory_categories) && details.advisory_categories.length > 0) {
      console.log(`Advisory categories: ${details.advisory_categories.join(', ')}`);
    }
  }
  console.log('');
  console.log(`Next: ${result.next_action || result.next_command}`);
  console.log(`Why: ${result.why}`);
  console.log(`Recommendation: ${result.recommendation}`);
}

module.exports = {
  improvePaper,
  printImprove,
};
