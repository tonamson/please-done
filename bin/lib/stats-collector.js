'use strict';

const fs = require('fs');
const path = require('path');

function parseRoadmapPhases(content) {
  if (!content || typeof content !== 'string') {
    return { totalPhases: 0, completedPhases: 0, phases: [], milestones: [], progressTable: [] };
  }

  const phases = [];
  const phaseRegex = /^- \[([ xX])\] \*\*Phase (\d+):?\s*([^*]*)\*\*/gm;
  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    const checked = match[1].toLowerCase() === 'x';
    phases.push({
      number: parseInt(match[2]),
      name: match[3].trim(),
      status: checked ? 'complete' : 'not_started'
    });
  }

  const completedPhases = phases.filter(p => p.status === 'complete').length;

  const milestones = [];
  const milestoneRegex = /^- ✅ \*\*([^*]+)\*\*\s*[—–-]\s*(?:Phases ([\d-]+))\s*\((?:shipped|complete)\s+([\d-]+)\)?/gm;
  while ((match = milestoneRegex.exec(content)) !== null) {
    milestones.push({
      name: match[1].trim(),
      phases: match[2] ? match[2].trim() : '',
      date: match[3] ? match[3].trim() : '',
      status: 'complete'
    });
  }

  const activeMsRegex = /^## 🔄 (.+) \(In Progress\)/m;
  const activeMatch = content.match(activeMsRegex);
  if (activeMatch) {
    milestones.unshift({ name: activeMatch[1].trim(), status: 'active', date: '', phases: '' });
  }

  const progressTable = [];
  const tableRowRegex = /^\| (\d+)\.\s+([^|]+)\| (\d+\/\d+)\s+\| ([^|]+)\| ([^|]*)\|/gm;
  while ((match = tableRowRegex.exec(content)) !== null) {
    progressTable.push({
      phase: match[1] + '. ' + match[2].trim(),
      plansComplete: match[3].trim(),
      status: match[4].trim(),
      completed: match[5].trim() || '-'
    });
  }

  return {
    totalPhases: phases.length,
    completedPhases,
    phases,
    milestones,
    progressTable
  };
}

function parseStateProgress(content) {
  if (!content || typeof content !== 'string') {
    return {
      milestone: 'unknown',
      milestoneName: 'unknown',
      phase: 'unknown',
      status: 'unknown',
      progress: { total_phases: 0, completed_phases: 0, total_plans: 0, completed_plans: 0 }
    };
  }

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const fm = fmMatch ? fmMatch[1] : '';

  function extractVal(key) {
    const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
    const m = fm.match(re);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  }

  const progress = { total_phases: 0, completed_phases: 0, total_plans: 0, completed_plans: 0 };

  const flatTotal = extractVal('total_phases');
  if (flatTotal) progress.total_phases = parseInt(flatTotal) || 0;
  const flatCompleted = extractVal('completed_phases');
  if (flatCompleted) progress.completed_phases = parseInt(flatCompleted) || 0;
  const flatTotalPlans = extractVal('total_plans');
  if (flatTotalPlans) progress.total_plans = parseInt(flatTotalPlans) || 0;
  const flatCompletedPlans = extractVal('completed_plans');
  if (flatCompletedPlans) progress.completed_plans = parseInt(flatCompletedPlans) || 0;

  const progressSection = fm.match(/progress:\s*\n((?:\s+\w+:.+\n?)+)/m);
  if (progressSection) {
    const lines = progressSection[1].split('\n');
    for (const line of lines) {
      const lm = line.match(/^\s+(\w+):\s*(\d+)/);
      if (lm) progress[lm[1]] = parseInt(lm[2]) || 0;
    }
  }

  return {
    milestone: extractVal('milestone') || 'unknown',
    milestoneName: extractVal('milestone_name') || 'unknown',
    phase: extractVal('phase') || 'unknown',
    status: extractVal('status') || 'unknown',
    progress
  };
}

function parseRequirements(content) {
  if (!content || typeof content !== 'string') {
    return { total: 0, completed: 0, active: 0 };
  }

  let completed = 0;
  let active = 0;

  const lines = content.split('\n');
  for (const line of lines) {
    if (/^- \[x\]/i.test(line)) {
      completed++;
    } else if (/^- \[ \]/.test(line)) {
      active++;
    }
  }

  return { total: completed + active, completed, active };
}

function countProjectFiles(rootDir) {
  if (!rootDir || typeof rootDir !== 'string') {
    return { totalFiles: 0, totalLoc: 0, breakdown: [] };
  }

  const dirs = ['bin', 'commands', 'workflows', 'templates', 'references', 'test'];
  const excludePatterns = ['node_modules', '.git', 'FastCode', '.planning/milestones', 'test/snapshots'];

  let totalFiles = 0;
  let totalLoc = 0;
  const breakdown = [];

  for (const dir of dirs) {
    const dirPath = path.join(rootDir, dir);
    if (!fs.existsSync(dirPath)) continue;

    let fileCount = 0;
    let locCount = 0;

    function walkDir(dirP) {
      const entries = fs.readdirSync(dirP, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirP, entry.name);
        if (excludePatterns.some(p => fullPath.includes(p))) continue;

        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          fileCount++;
          try {
            const fileContent = fs.readFileSync(fullPath, 'utf8');
            locCount += fileContent.split('\n').length;
          } catch (_) {}
        }
      }
    }

    try {
      walkDir(dirPath);
    } catch (_) {
      continue;
    }

    totalFiles += fileCount;
    totalLoc += locCount;
    if (fileCount > 0) {
      breakdown.push({ dir, files: fileCount, loc: locCount });
    }
  }

  return { totalFiles, totalLoc, breakdown };
}

function extractTimeline(gitLog, milestones) {
  if ((!gitLog || typeof gitLog !== 'string') && (!milestones || milestones.length === 0)) {
    return [];
  }

  const timeline = [];
  const msArray = Array.isArray(milestones) ? milestones : [];

  for (const ms of msArray) {
    if (ms.status !== 'complete') continue;

    let startDate = '';
    let completionDate = ms.date || '';

    if (gitLog && typeof gitLog === 'string') {
      const msName = ms.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const versionMatch = ms.name.match(/v\d+\.\d+/);
      if (versionMatch) {
        const version = versionMatch[0];
        const logLine = gitLog.split('\n').find(l => l.includes(version) || l.includes('complete-milestone'));
        if (logLine) {
          startDate = '';
        }
      }
    }

    const phasesMatch = ms.phases ? ms.phases.match(/(\d+)-(\d+)/) : null;

    timeline.push({
      milestone: ms.name,
      startDate: startDate || ms.date || '',
      completionDate: completionDate || ms.date || '',
      phases: phasesMatch ? parseInt(phasesMatch[2]) - parseInt(phasesMatch[1]) + 1 : 0,
      plans: 0
    });
  }

  return timeline;
}

function padRight(str, length) {
  const s = String(str || '');
  if (s.length >= length) return s;
  return s + ' '.repeat(length - s.length);
}

function formatStatsTable(stats) {
  if (!stats) return '';

  const W = 50;
  const border = W + 1;
  const lines = [];

  lines.push(`╔${'═'.repeat(border)}╗`);

  function addSection(title, rows) {
    lines.push(`║ ${padRight(title, W)}║`);
    lines.push(`║ ${padRight('─'.repeat(W - 2), W)}║`);
    for (const row of rows) {
      lines.push(`║ ${padRight(row, W)}║`);
    }
    lines.push(`║ ${padRight('', W)}║`);
  }

  const { state, phases: phasesData, requirements, files, timeline } = stats;

  const overviewRows = [];
  if (state) {
    overviewRows.push(`Milestone:   ${state.milestone || 'unknown'}`);
    overviewRows.push(`Phase:       ${state.phase || 'unknown'}`);
    overviewRows.push(`Status:      ${state.status || 'unknown'}`);
    if (state.progress) {
      const p = state.progress;
      overviewRows.push(`Phases:      ${p.completed_phases}/${p.total_phases} (${Math.round(p.total_phases > 0 ? (p.completed_phases / p.total_phases) * 100 : 0)}%)`);
      overviewRows.push(`Plans:       ${p.completed_plans}/${p.total_plans} (${Math.round(p.total_plans > 0 ? (p.completed_plans / p.total_plans) * 100 : 0)}%)`);
    }
  }
  if (requirements) {
    overviewRows.push(`Requirements: ${requirements.completed}/${requirements.total} (${requirements.active} active)`);
  }
  if (phasesData) {
    overviewRows.push(`Total Phases: ${phasesData.totalPhases} (${phasesData.completedPhases} completed)`);
  }
  addSection('  OVERVIEW', overviewRows);

  if (files) {
    const fileRows = [];
    if (files.breakdown && files.breakdown.length > 0) {
      for (const b of files.breakdown) {
        fileRows.push(`  ${padRight(b.dir, 14)} ${padRight(String(b.files) + ' files', 12)} ${b.loc} LOC`);
      }
      fileRows.push(`  ${padRight('TOTAL', 14)} ${padRight(String(files.totalFiles) + ' files', 12)} ${files.totalLoc} LOC`);
    } else {
      fileRows.push('  No files found');
    }
    addSection('  FILE STATS', fileRows);
  }

  if (timeline && timeline.length > 0) {
    const tlRows = [];
    for (const t of timeline.slice(0, 10)) {
      const name = t.milestone.length > 28 ? t.milestone.slice(0, 25) + '...' : t.milestone;
      tlRows.push(`  ${padRight(name, 30)} ${t.completionDate || '-'}`);
    }
    addSection('  TIMELINE', tlRows);
  }

  lines.push(`╚${'═'.repeat(border)}╝`);

  return lines.join('\n');
}

function formatStatsJson(stats) {
  return JSON.stringify(stats, null, 2);
}

module.exports = {
  parseRoadmapPhases,
  parseStateProgress,
  parseRequirements,
  countProjectFiles,
  extractTimeline,
  formatStatsTable,
  formatStatsJson
};
