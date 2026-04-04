/**
 * Dashboard Renderer - Pure functions for rendering project status dashboard
 * @module dashboard-renderer
 */

/**
 * Parses STATE.md content to extract project state
 * @param {string} content - Raw STATE.md content
 * @returns {Object} Parsed state with milestone, phase, progress, blockers
 */
function parseState(content) {
  if (!content || typeof content !== 'string') {
    return {
      milestone: 'unknown',
      milestoneName: 'Unknown',
      phase: 'unknown',
      status: 'unknown',
      progress: { total_phases: 0, completed_phases: 0, total_plans: 0, completed_plans: 0 },
      blockers: []
    };
  }

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

  // Parse YAML-like frontmatter
  let phase = extractValue(frontmatter, 'phase');

  // If phase not in frontmatter, try to extract from "stopped_at:" field
  if (!phase) {
    const stoppedAt = extractValue(frontmatter, 'stopped_at');
    const stoppedMatch = stoppedAt.match(/Phase\s+(\d+(?:\.\d+)?)/i);
    if (stoppedMatch) {
      phase = stoppedMatch[1];
    }
  }

  const state = {
    milestone: extractValue(frontmatter, 'milestone'),
    milestoneName: extractValue(frontmatter, 'milestone_name'),
    phase: phase,
    status: extractValue(frontmatter, 'status'),
    progress: parseProgress(frontmatter),
    blockers: []
  };

  // Extract blockers from body (after frontmatter)
  const bodyMatch = content.match(/---\n([\s\S]*)/);
  const body = bodyMatch && bodyMatch[1] ? bodyMatch[1] : '';
  state.blockers = extractBlockers(body);

  return state;
}

/**
 * Extracts a value from frontmatter text
 * @param {string} frontmatter - Frontmatter content
 * @param {string} key - Key to extract
 * @returns {string} Extracted value or empty string
 */
function extractValue(frontmatter, key) {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Parses progress section from frontmatter
 * @param {string} frontmatter - Frontmatter content
 * @returns {Object} Progress stats
 */
function parseProgress(frontmatter) {
  const progress = {
    total_phases: parseInt(extractValue(frontmatter, 'total_phases')) || 0,
    completed_phases: parseInt(extractValue(frontmatter, 'completed_phases')) || 0,
    total_plans: parseInt(extractValue(frontmatter, 'total_plans')) || 0,
    completed_plans: parseInt(extractValue(frontmatter, 'completed_plans')) || 0
  };

  // Also try nested progress structure
  const progressSection = frontmatter.match(/progress:\s*\n((?:\s+\w+:.+\n?)+)/m);
  if (progressSection) {
    const lines = progressSection[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s+(\w+):\s*(\d+)/);
      if (match) {
        progress[match[1]] = parseInt(match[2]) || 0;
      }
    });
  }

  return progress;
}

/**
 * Extracts blockers from body content
 * @param {string} body - Body content of STATE.md
 * @returns {Array<string>} List of blockers
 */
function extractBlockers(body) {
  if (!body) return [];

  // Look for Blockers section
  const blockersMatch = body.match(/##\s*Blockers[\/\s\w]*[\s\S]*?(?=##|$)/i);
  if (!blockersMatch) return [];

  const blockersSection = blockersMatch[0];
  const lines = blockersSection.split('\n');
  const blockers = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const blocker = trimmed.slice(2).trim();
      if (blocker && blocker.toLowerCase() !== 'none') {
        blockers.push(blocker);
      }
    }
  }

  return blockers;
}

/**
 * Parses TASKS.md content to extract pending tasks
 * @param {string} content - Raw TASKS.md content
 * @returns {Array<Object>} List of pending tasks with id, title, status, priority
 */
function parseTasks(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const tasks = [];
  const lines = content.split('\n');

  let currentTask = null;
  let inActiveSection = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check for section headers
    if (trimmed.match(/^#{1,3}\s*Active\s+Tasks/i)) {
      inActiveSection = true;
      continue;
    }
    if (trimmed.match(/^#{1,3}\s*(Completed|Done|Closed)/i)) {
      // Save current task before leaving section
      if (currentTask && currentTask.status !== 'completed' && currentTask.status !== 'done') {
        tasks.push({ ...currentTask });
      }
      currentTask = null;
      inActiveSection = false;
      continue;
    }

    // Skip if not in active section
    if (!inActiveSection) continue;

    // Parse task entries - look for task headers like "### P90-T1: Task Name"
    // Pattern: optional ###, task ID (letters+digits+optional -suffix), optional :, title
    const taskMatch = trimmed.match(/^#{1,3}\s*([A-Z]+\d+(?:-[A-Z0-9]+)?):?\s*(.+)/i);
    if (taskMatch) {
      // Save previous task before starting new one
      if (currentTask && currentTask.status !== 'completed' && currentTask.status !== 'done') {
        tasks.push({ ...currentTask });
      }
      currentTask = {
        id: taskMatch[1],
        title: taskMatch[2].trim(),
        status: 'pending',
        priority: 'medium'
      };
      continue;
    }

    // Parse task properties
    if (currentTask && trimmed.startsWith('- **')) {
      const propMatch = trimmed.match(/-\s*\*\*(\w+):\*\*\s*(.+)/);
      if (propMatch) {
        const key = propMatch[1].toLowerCase();
        const value = propMatch[2].trim();

        if (key === 'status') {
          currentTask.status = value.toLowerCase().replace(/[^\w]/g, '');
        } else if (key === 'priority') {
          currentTask.priority = value.toLowerCase();
        }
      }
    }
  }

  // Don't forget the last task
  if (currentTask && currentTask.status !== 'completed' && currentTask.status !== 'done') {
    tasks.push({ ...currentTask });
  }

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Formats log entries for dashboard display
 * @param {Array<Object>} logs - Log entries
 * @param {number} limit - Maximum number of entries to show
 * @returns {Array<string>} Formatted log strings
 */
function formatErrors(logs, limit = 5) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return [];
  }

  // Filter out null/undefined entries and entries without timestamp
  const validLogs = logs.filter(log => log && log.timestamp);

  if (validLogs.length === 0) {
    return [];
  }

  // Sort by timestamp descending (most recent first)
  const sortedLogs = [...validLogs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const limitedLogs = sortedLogs.slice(0, limit);

  return limitedLogs.map(entry => {
    const level = (entry.level || 'INFO').toUpperCase();
    const levelIndicator = getLevelIndicator(level);
    const phase = entry.phase || '?';
    const agent = entry.agent || 'unknown';
    const error = entry.error || entry.message || 'No message';

    // Truncate long error messages
    const truncatedError = error.length > 50 ? error.slice(0, 47) + '...' : error;

    return `[${levelIndicator}] Phase ${phase} - ${agent}: ${truncatedError}`;
  });
}

/**
 * Gets indicator symbol for log level
 * @param {string} level - Log level
 * @returns {string} Indicator symbol
 */
function getLevelIndicator(level) {
  const indicators = {
    'ERROR': 'x',
    'WARN': '!',
    'WARNING': '!',
    'INFO': 'i',
    'DEBUG': '*'
  };
  return indicators[level] || '-';
}

/**
 * Renders a table from data
 * @param {Array<Object>} data - Table data
 * @param {Array<string>} columns - Column names
 * @param {Object} options - Options
 * @param {number} options.maxWidth - Maximum table width
 * @returns {string} Formatted table
 */
function renderTable(data, columns, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const maxWidth = options.maxWidth || 80;
  const colWidth = Math.floor((maxWidth - columns.length * 3) / columns.length);

  // Build header
  const header = columns.map(col => padRight(col, colWidth)).join(' | ');
  const separator = columns.map(() => '-'.repeat(colWidth)).join('-+-');

  // Build rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = String(row[col] || row[col.toLowerCase()] || '');
      const truncated = value.length > colWidth ? value.slice(0, colWidth - 3) + '...' : value;
      return padRight(truncated, colWidth);
    }).join(' | ');
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * Pads string to right with spaces
 * @param {string} str - String to pad
 * @param {number} length - Target length
 * @returns {string} Padded string
 */
function padRight(str, length) {
  if (str.length >= length) return str;
  return str + ' '.repeat(length - str.length);
}

/**
 * Calculates progress percentage
 * @param {number} completed - Completed items
 * @param {number} total - Total items
 * @returns {string} Formatted percentage
 */
function calculateProgress(completed, total) {
  if (total === 0) return '0%';
  const percentage = Math.round((completed / total) * 100);
  return `${percentage}%`;
}

/**
 * Renders the full dashboard
 * @param {Object} options - Dashboard options
 * @param {Object} options.state - Parsed state object
 * @param {Array<Object>} options.tasks - Parsed tasks array
 * @param {Array<Object>} options.logs - Log entries
 * @param {number} options.errorLimit - Max errors to show
 * @param {string} options.format - Output format ('text' or 'json')
 * @returns {string} Formatted dashboard
 */
function renderDashboard(options) {
  const { state, tasks, logs, errorLimit = 5, format = 'text' } = options;

  if (format === 'json') {
    return JSON.stringify({
      milestone: state.milestone,
      milestoneName: state.milestoneName,
      phase: state.phase,
      status: state.status,
      progress: state.progress,
      tasks: tasks,
      errors: logs.slice(0, errorLimit),
      blockers: state.blockers
    }, null, 2);
  }

  const lines = [];

  // Header
  lines.push('===========================================================');
  lines.push('  PD:STATUS - PROJECT DASHBOARD');
  lines.push('===========================================================');
  lines.push('');

  // Phase & Milestone
  lines.push(`Milestone: ${state.milestoneName || state.milestone}`);
  lines.push(`Phase: ${state.phase}`);
  lines.push(`Status: ${state.status}`);
  lines.push('');

  // Progress
  const phaseProgress = calculateProgress(state.progress.completed_phases, state.progress.total_phases);
  const planProgress = calculateProgress(state.progress.completed_plans, state.progress.total_plans);

  lines.push(`Progress:`);
  lines.push(`  Phases: ${state.progress.completed_phases}/${state.progress.total_phases} (${phaseProgress})`);
  lines.push(`  Plans: ${state.progress.completed_plans}/${state.progress.total_plans} (${planProgress})`);
  lines.push('');

  // Pending Tasks
  lines.push('Pending Tasks:');
  if (tasks.length === 0) {
    lines.push('  (No pending tasks)');
  } else {
    tasks.slice(0, 10).forEach(task => {
      const priorityIndicator = task.priority === 'high' ? '!' : task.priority === 'medium' ? '*' : '-';
      lines.push(`  ${priorityIndicator} ${task.id}: ${task.title}`);
    });
    if (tasks.length > 10) {
      lines.push(`  ... and ${tasks.length - 10} more`);
    }
  }
  lines.push('');

  // Recent Errors
  const formattedErrors = formatErrors(logs, errorLimit);
  lines.push(`Recent Errors (last ${Math.min(logs.length, errorLimit)}):`);
  if (formattedErrors.length === 0) {
    lines.push('  (No recent errors)');
  } else {
    formattedErrors.forEach(error => {
      lines.push(`  ${error}`);
    });
  }
  lines.push('');

  // Blockers
  lines.push('Blockers:');
  if (state.blockers.length === 0) {
    lines.push('  None');
  } else {
    state.blockers.forEach(blocker => {
      lines.push(`  ! ${blocker}`);
    });
  }
  lines.push('');
  lines.push('===========================================================');

  return lines.join('\n');
}

export {
  parseState,
  parseTasks,
  formatErrors,
  renderTable,
  renderDashboard,
  calculateProgress,
  getLevelIndicator,
  extractValue,
  parseProgress,
  extractBlockers,
  padRight
};
