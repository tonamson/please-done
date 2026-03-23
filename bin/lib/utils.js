/**
 * Tiện ích chung cho installer — parse frontmatter, hash files,
 * copy với path replacement, và terminal colors.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Terminal colors ──────────────────────────────────────
const COLORS = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

function colorize(color, text) {
  return `${COLORS[color] || ''}${text}${COLORS.reset}`;
}

const log = {
  info: (msg) => console.log(msg),
  success: (msg) => console.log(colorize('green', `  ✓ ${msg}`)),
  warn: (msg) => console.log(colorize('yellow', `  ⚠ ${msg}`)),
  error: (msg) => console.log(colorize('red', `  ✗ ${msg}`)),
  step: (num, total, msg) => console.log(colorize('yellow', `[${num}/${total}] ${msg}`)),
  banner: (lines) => {
    const width = 40;
    const border = width + 1; // ║ + space(1) + content(width-1) + ║ = width+1 between borders
    console.log(colorize('cyan', `╔${'═'.repeat(border)}╗`));
    for (const line of lines) {
      const padded = (line || '').padEnd(width).slice(0, width);
      console.log(colorize('cyan', `║ ${padded}║`));
    }
    console.log(colorize('cyan', `╚${'═'.repeat(border)}╝`));
  },
};

// ─── Frontmatter parser ───────────────────────────────────

/**
 * Parse YAML frontmatter từ markdown content.
 * Trả về { frontmatter: object, body: string, raw: string }
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content, raw: '' };

  const raw = match[1];
  const body = match[2];
  const frontmatter = {};

  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();

    // Array item
    if (inArray && trimmed.startsWith('- ')) {
      arrayValues.push(trimmed.slice(2).trim());
      continue;
    }

    // End of array — save previous
    if (inArray && currentKey) {
      frontmatter[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
      currentKey = null;
    }

    // Key: value pair
    const kvMatch = trimmed.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '') {
        // Could be start of array
        currentKey = key;
        inArray = true;
        arrayValues = [];
      } else {
        frontmatter[key] = value;
      }
    }
  }

  // Flush last array
  if (inArray && currentKey) {
    frontmatter[currentKey] = arrayValues;
  }

  return { frontmatter, body, raw };
}

/**
 * Rebuild YAML frontmatter từ object.
 */
function buildFrontmatter(fm) {
  const lines = [];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

/**
 * Combine frontmatter + body thành markdown hoàn chỉnh.
 */
function assembleMd(frontmatter, body) {
  const fm = buildFrontmatter(frontmatter);
  return `---\n${fm}\n---\n${body}`;
}

// ─── File utilities ───────────────────────────────────────

/**
 * SHA256 hash cho nội dung file.
 */
function fileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Đọc danh sách skill files từ source directory.
 * Trả về array of { name, filePath, content }
 */
function listSkillFiles(skillsDir) {
  const files = fs.readdirSync(skillsDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('.'));

  return files.map(f => ({
    name: f.replace('.md', ''),
    filePath: path.join(skillsDir, f),
    content: fs.readFileSync(path.join(skillsDir, f), 'utf8'),
  }));
}

/**
 * Kiểm tra command có tồn tại trong PATH.
 */
function commandExists(cmd) {
  const { execSync } = require('child_process');
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Chạy shell command, trả về stdout.
 */
function exec(cmd, options = {}) {
  const { execSync } = require('child_process');
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      timeout: options.timeout || 30000,
      ...options,
    }).trim();
  } catch (err) {
    if (options.ignoreError) return '';
    throw err;
  }
}

/**
 * Detect WSL environment.
 */
function isWSL() {
  if (process.platform === 'win32') return false;
  try {
    const release = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    return release.includes('microsoft') || release.includes('wsl');
  } catch {
    return false;
  }
}

// ─── Workflow inlining ─────────────────────────────────

/**
 * Extract nội dung bên trong 1 XML tag từ string.
 * Trả về nội dung trim hoặc null nếu không tìm thấy.
 */
function extractXmlSection(content, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`);
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Trích xuất các tham chiếu @templates/... và @references/... từ text.
 * Trả về array unique theo thứ tự xuất hiện.
 */
function extractReadingRefs(content) {
  const refs = [];
  const seen = new Set();

  for (const match of content.matchAll(/@(templates|references)\/([a-z0-9_/-]+\.md)/g)) {
    const ref = `${match[1]}/${match[2]}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push(ref);
    }
  }

  return refs;
}

/**
 * Thay thế @references/guard-*.md bằng nội dung file tương ứng.
 * Chỉ match các dòng standalone @references/guard-*.md (không match refs khác).
 * Nếu file không tồn tại, giữ nguyên dòng gốc.
 */
function inlineGuardRefs(body, skillsDir) {
  return body.replace(
    /^@references\/(guard-[a-z0-9_-]+\.md)$/gm,
    (match, filename) => {
      const guardPath = path.join(skillsDir, 'references', filename);
      if (!fs.existsSync(guardPath)) return match;
      return fs.readFileSync(guardPath, 'utf8').trim();
    }
  );
}

/**
 * Loading conditions cho optional references.
 * Key = ref path (e.g., 'references/security-checklist.md')
 * Value = Vietnamese loading condition string
 */
const CONDITIONAL_LOADING_MAP = {
  'references/security-checklist.md': 'KHI task lien quan den auth, encryption, input validation, data exposure',
  'references/ui-brand.md': 'KHI task tao/sua UI components hoac man hinh user-facing',
  'references/verification-patterns.md': 'KHI task can multi-level verification (khong phai simple pass/fail)',
  'references/state-machine.md': 'KHI task lien quan den milestone state transitions',
  'references/questioning.md': 'KHI DISCUSS mode -- can interactive user questioning',
  'references/prioritization.md': 'KHI task ordering/ranking nhieu tasks hoac triage',
  'templates/current-milestone.md': 'KHI task lien quan den milestone state management',
  'templates/state.md': 'KHI task lien quan den milestone state management',
};

/**
 * Classify refs from execution_context into required vs optional.
 * Parses lines matching @(references|templates)/X.md (required|optional).
 * Workflows are excluded (handled separately).
 * Returns { required: string[], optional: string[] } where strings are 'references/X.md' or 'templates/X.md'.
 */
function classifyRefs(executionContext) {
  const required = [];
  const optional = [];

  for (const line of executionContext.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^@(references|templates)\/([a-z0-9_/-]+\.md)\s+\((required|optional)\)$/);
    if (!match) continue;

    const ref = `${match[1]}/${match[2]}`;
    if (match[3] === 'optional') {
      optional.push(ref);
    } else {
      required.push(ref);
    }
  }

  return { required, optional };
}

/**
 * Inline nội dung workflow vào body của command.
 * Nếu command tham chiếu @workflows/X.md, đọc file workflow và:
 * - Thay <execution_context> bằng <required_reading> từ workflow (only required refs)
 * - Append <conditional_reading> cho optional refs (file paths + loading conditions)
 * - Thay <process> mỏng bằng <process> đầy đủ từ workflow
 * - Merge <rules> từ command + workflow
 *
 * Dùng đường dẫn gốc Claude (~/.claude/) — converter sẽ replace paths sau.
 */
function inlineWorkflow(body, skillsDir) {
  // Expand guard references (independent of workflow presence)
  body = inlineGuardRefs(body, skillsDir);

  // Tìm tham chiếu @workflows/X.md
  const workflowMatch = body.match(/@workflows\/([a-z0-9_-]+\.md)/);
  if (!workflowMatch) return body;

  const executionContext = extractXmlSection(body, 'execution_context') || '';
  const workflowPath = path.join(skillsDir, 'workflows', workflowMatch[1]);
  if (!fs.existsSync(workflowPath)) return body;

  const workflowContent = fs.readFileSync(workflowPath, 'utf8');

  // Extract sections từ workflow
  const wfProcess = extractXmlSection(workflowContent, 'process');
  const wfRules = extractXmlSection(workflowContent, 'rules');
  const wfRequiredReading = extractXmlSection(workflowContent, 'required_reading');

  // Classify command refs as required/optional
  const { required: cmdRequired, optional: cmdOptional } = classifyRefs(executionContext);
  const optionalSet = new Set(cmdOptional);

  // 1. Thay <execution_context> bằng <required_reading> từ workflow (only required refs)
  if (wfRequiredReading) {
    let reading = wfRequiredReading;
    // Transform @templates/ và @references/ thành [SKILLS_DIR]-based paths
    reading = reading.replace(/@templates\//g, '[SKILLS_DIR]/templates/');
    reading = reading.replace(/@references\//g, '[SKILLS_DIR]/references/');
    // Bỏ dòng chung "Đọc tất cả files được tham chiếu..."
    reading = reading.replace(/Đọc tất cả files được tham chiếu trong execution_context.*?:\n?/g, '');

    // Filter out optional refs from required_reading
    const filteredReading = reading.split('\n')
      .filter(line => {
        for (const opt of optionalSet) {
          if (line.includes(`[SKILLS_DIR]/${opt}`)) {
            return false;
          }
        }
        return true;
      })
      .join('\n');

    const workflowRefs = extractReadingRefs(wfRequiredReading);

    // Add extra REQUIRED refs from command not already in workflow
    const extraRequired = cmdRequired.filter(ref => !workflowRefs.includes(ref));
    let requiredSection = filteredReading.trim();
    if (extraRequired.length > 0) {
      const extraLines = extraRequired
        .map(ref => `- [SKILLS_DIR]/${ref}`)
        .join('\n');
      requiredSection = `${requiredSection}\n${extraLines}`;
    }

    body = body.replace(
      /<execution_context>[\s\S]*?<\/execution_context>/,
      `<required_reading>\nĐọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:\n(Claude Code: cat ~/.claude/commands/pd/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)\n${requiredSection}\n</required_reading>`
    );

    // Build <conditional_reading> for optional refs
    if (cmdOptional.length > 0) {
      const conditionalLines = cmdOptional.map(ref => {
        const condition = CONDITIONAL_LOADING_MAP[ref] || 'KHI task can';
        return `- [SKILLS_DIR]/${ref} -- ${condition}`;
      });

      const conditionalBlock = `\n<conditional_reading>\nĐọc CHỈ KHI cần (phân tích mô tả task trước):\n${conditionalLines.join('\n')}\n</conditional_reading>`;

      body = body.replace(
        '</required_reading>',
        '</required_reading>' + conditionalBlock
      );
    }
  } else {
    body = body.replace(/<execution_context>[\s\S]*?<\/execution_context>\n?/, '');
  }

  // 2. Thay <process> mỏng bằng <process> đầy đủ từ workflow
  if (wfProcess) {
    let processContent = wfProcess;
    processContent = processContent.replace(/@templates\//g, '[SKILLS_DIR]/templates/');
    processContent = processContent.replace(/@references\//g, '[SKILLS_DIR]/references/');

    body = body.replace(
      /<process>[\s\S]*?<\/process>/,
      `<process>\n${processContent}\n</process>`
    );
  }

  // 3. Merge rules: command rules + workflow rules
  if (wfRules) {
    let transformedWfRules = wfRules;
    transformedWfRules = transformedWfRules.replace(/@templates\//g, '[SKILLS_DIR]/templates/');
    transformedWfRules = transformedWfRules.replace(/@references\//g, '[SKILLS_DIR]/references/');

    const existingRulesMatch = body.match(/<rules>([\s\S]*?)<\/rules>/);
    if (existingRulesMatch) {
      const cmdRules = existingRulesMatch[1].trim();
      body = body.replace(
        /<rules>[\s\S]*?<\/rules>/,
        `<rules>\n${cmdRules}\n${transformedWfRules}\n</rules>`
      );
    } else {
      body += `\n<rules>\n${transformedWfRules}\n</rules>`;
    }
  }

  return body;
}

module.exports = {
  log,
  parseFrontmatter,
  buildFrontmatter,
  fileHash,
  listSkillFiles,
  commandExists,
  exec,
  isWSL,
  extractXmlSection,
  extractReadingRefs,
  classifyRefs,
  inlineGuardRefs,
  inlineWorkflow,
};
