/**
 * Mermaid Validator Module — syntax + style compliance checker
 *
 * Pure function: nhan Mermaid text, tra ve { valid, errors, warnings }.
 * Zero dependencies — self-contained.
 * Rules spec: references/mermaid-rules.md
 */

'use strict';

// ─── Constants ────────────────────────────────────────────

const VALID_DIRECTIONS = ['TD', 'TB', 'BT', 'LR', 'RL'];

const RESERVED_KEYWORDS = [
  'end', 'graph', 'subgraph', 'click', 'call', 'default',
  'style', 'classDef', 'class', 'linkStyle',
];

const PALETTE = {
  primary: '#2563EB',
  secondary: '#64748B',
  accent: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
};

const SHAPE_BY_ROLE = {
  service: 'rectangle',
  database: 'cylinder',
  api: 'rounded',
  decision: 'diamond',
  'start-end': 'stadium',
  external: 'subroutine',
};

const MAX_NODES = 15;

const PALETTE_VALUES = Object.values(PALETTE).map(c => c.toUpperCase());

// ─── Syntax Checks (errors) ──────────────────────────────

/**
 * Check first non-blank/non-comment line is flowchart/graph declaration with valid direction.
 * @param {string[]} lines
 * @returns {Array<{line: number, message: string, type: string}>}
 */
function checkDeclaration(lines) {
  const errors = [];

  // Find first non-blank, non-comment line
  let firstLine = -1;
  let firstContent = '';
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '' || trimmed.startsWith('%%')) continue;
    firstLine = i;
    firstContent = trimmed;
    break;
  }

  if (firstLine === -1) {
    // All blank/comment — handled by empty check in main
    return errors;
  }

  const declMatch = firstContent.match(/^(flowchart|graph)\s+(\S+)\s*$/);
  if (!declMatch) {
    // Check if it starts with flowchart/graph but has wrong direction
    const partialMatch = firstContent.match(/^(flowchart|graph)\s+(\S+)/);
    if (partialMatch && !VALID_DIRECTIONS.includes(partialMatch[2])) {
      errors.push({
        line: firstLine + 1,
        message: `Invalid direction "${partialMatch[2]}" — must be one of: ${VALID_DIRECTIONS.join(', ')}`,
        type: 'syntax',
      });
    } else {
      errors.push({
        line: firstLine + 1,
        message: 'Missing flowchart/graph declaration with valid direction',
        type: 'syntax',
      });
    }
  } else {
    const dir = declMatch[2];
    if (!VALID_DIRECTIONS.includes(dir)) {
      errors.push({
        line: firstLine + 1,
        message: `Invalid direction "${dir}" — must be one of: ${VALID_DIRECTIONS.join(', ')}`,
        type: 'syntax',
      });
    }
  }

  return errors;
}

/**
 * Check for unclosed double quotes on each line.
 * @param {string[]} lines
 * @returns {Array<{line: number, message: string, type: string}>}
 */
function checkUnclosedQuotes(lines) {
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip blank lines and comment lines
    if (trimmed === '' || trimmed.startsWith('%%')) continue;

    // Count double quotes
    const quoteCount = (lines[i].match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      errors.push({
        line: i + 1,
        message: 'Unclosed double quote',
        type: 'syntax',
      });
    }
  }

  return errors;
}

/**
 * Check for reserved keywords used as unquoted node IDs.
 * @param {string[]} lines
 * @returns {Array<{line: number, message: string, type: string}>}
 */
function checkReservedKeywords(lines) {
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip blank, comment, classDef, style, linkStyle, class, subgraph lines
    if (trimmed === '' || trimmed.startsWith('%%')) continue;
    if (/^(flowchart|graph)\s/.test(trimmed)) continue;
    if (/^(classDef|style|linkStyle|class)\s/.test(trimmed)) continue;

    // "subgraph" as a declaration keyword is valid — skip lines starting with "subgraph "
    if (/^subgraph\s/.test(trimmed)) continue;

    // "end" as subgraph closer on its own line is valid
    if (trimmed === 'end') continue;

    // Look for node IDs at beginning of line (possibly after whitespace)
    // A node ID is a word at the start, before any shape bracket
    const nodeIdMatch = trimmed.match(/^(\w+)\s*(-->|-.->|==>|\[|\(|\{|$)/);
    if (nodeIdMatch) {
      const nodeId = nodeIdMatch[1].toLowerCase();
      if (RESERVED_KEYWORDS.includes(nodeId)) {
        // Check if it's inside quotes (it's a node definition with quoted label, not bare)
        // If the line has a shape with the keyword as the ID (not quoted), it's an error
        errors.push({
          line: i + 1,
          message: `Reserved keyword "${nodeIdMatch[1]}" used as unquoted node ID`,
          type: 'syntax',
        });
      }
    }

    // Also check after arrows: --> end, --> graph, etc.
    const afterArrowPattern = /(?:-->|-.->|==>)\s*(\w+)\s*(?:$|[^\[("\{])/g;
    let arrowMatch;
    while ((arrowMatch = afterArrowPattern.exec(trimmed)) !== null) {
      const targetId = arrowMatch[1].toLowerCase();
      if (RESERVED_KEYWORDS.includes(targetId)) {
        // Make sure it's not already caught as node ID at start
        if (!nodeIdMatch || nodeIdMatch[1].toLowerCase() !== targetId) {
          errors.push({
            line: i + 1,
            message: `Reserved keyword "${arrowMatch[1]}" used as unquoted node ID`,
            type: 'syntax',
          });
        }
      }
    }
  }

  return errors;
}

// ─── Style Checks (warnings) ─────────────────────────────

/**
 * Check classDef fill colors against approved palette.
 * @param {string[]} lines
 * @returns {Array<{line: number, message: string, type: string}>}
 */
function checkPalette(lines) {
  const warnings = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith('classDef')) continue;

    // Extract fill color: fill:#XXXXXX
    const fillMatch = trimmed.match(/fill:(#[0-9A-Fa-f]{6})/);
    if (fillMatch) {
      const color = fillMatch[1].toUpperCase();
      if (!PALETTE_VALUES.includes(color)) {
        warnings.push({
          line: i + 1,
          message: `Color ${fillMatch[1]} not in approved palette`,
          type: 'style',
        });
      }
    }
  }

  return warnings;
}

/**
 * Count unique node IDs and warn if exceeding MAX_NODES.
 * @param {string[]} lines
 * @returns {Array<{line: number, message: string, type: string}>}
 */
function checkNodeCount(lines) {
  const warnings = [];
  const nodeIds = new Set();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip blank, comment, declaration, classDef, style, linkStyle, class, subgraph, end
    if (trimmed === '' || trimmed.startsWith('%%')) continue;
    if (/^(flowchart|graph)\s/.test(trimmed)) continue;
    if (/^(classDef|style|linkStyle|class)\s/.test(trimmed)) continue;
    if (/^subgraph\s/.test(trimmed)) continue;
    if (trimmed === 'end') continue;

    // Extract node IDs: word characters followed by shape syntax or at start/after arrow
    // Node definitions: ID["..."], ID[("...")], ID("..."), ID{"..."}, ID(["..."]), ID[["..."]]
    const nodeDefPattern = /\b([A-Za-z_]\w*)\s*(?:\[\[|\[\(|\(\[|\[|{|\()/g;
    let match;
    while ((match = nodeDefPattern.exec(trimmed)) !== null) {
      const id = match[1];
      // Skip keywords
      if (['classDef', 'style', 'linkStyle', 'class', 'subgraph', 'flowchart', 'graph'].includes(id)) continue;
      nodeIds.add(id);
    }
  }

  if (nodeIds.size > MAX_NODES) {
    warnings.push({
      line: 0,
      message: `Diagram has ${nodeIds.size} nodes — maximum is ${MAX_NODES}. Consider splitting into subgraphs`,
      type: 'style',
    });
  }

  return warnings;
}

/**
 * Check that labels in node definitions are wrapped in double quotes.
 * @param {string[]} lines
 * @returns {Array<{line: number, message: string, type: string}>}
 */
function checkLabelQuoting(lines) {
  const warnings = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip blank, comment, declaration, classDef, style, linkStyle, class, subgraph, end
    if (trimmed === '' || trimmed.startsWith('%%')) continue;
    if (/^(flowchart|graph)\s/.test(trimmed)) continue;
    if (/^(classDef|style|linkStyle|class)\s/.test(trimmed)) continue;
    if (/^subgraph\s/.test(trimmed)) continue;
    if (trimmed === 'end') continue;

    // Find node definitions with shape brackets containing labels
    // Pattern: ID[label] where label is NOT wrapped in "..."
    // Match: word + opening bracket, then check if content starts with "
    // Simple rectangle: ID[label]
    const rectMatch = trimmed.match(/\b[A-Za-z_]\w*\[([^\]]*)\]/g);
    if (rectMatch) {
      for (const m of rectMatch) {
        // Extract the content inside the outermost brackets
        const bracketContent = m.match(/\[([^\]]*)\]/);
        if (bracketContent) {
          const content = bracketContent[1].trim();
          // Skip if it's a sub-shape: [("...")], [["..."]], (["..."])
          if (content.startsWith('(') || content.startsWith('[')) continue;
          // Skip empty brackets
          if (content === '') continue;
          // Check if label is quoted
          if (!content.startsWith('"')) {
            warnings.push({
              line: i + 1,
              message: 'Label not wrapped in double quotes',
              type: 'style',
            });
          }
        }
      }
    }

    // Parenthesis shapes: ID(label) — rounded
    const parenMatch = trimmed.match(/\b[A-Za-z_]\w*\(([^)]*)\)/g);
    if (parenMatch) {
      for (const m of parenMatch) {
        const parenContent = m.match(/\(([^)]*)\)/);
        if (parenContent) {
          const content = parenContent[1].trim();
          // Skip sub-shapes: (["..."])
          if (content.startsWith('[')) continue;
          // Skip empty
          if (content === '') continue;
          // Check if label is quoted
          if (!content.startsWith('"')) {
            warnings.push({
              line: i + 1,
              message: 'Label not wrapped in double quotes',
              type: 'style',
            });
          }
        }
      }
    }

    // Curly shapes: ID{label} — diamond
    const curlyMatch = trimmed.match(/\b[A-Za-z_]\w*\{([^}]*)\}/g);
    if (curlyMatch) {
      for (const m of curlyMatch) {
        const curlyContent = m.match(/\{([^}]*)\}/);
        if (curlyContent) {
          const content = curlyContent[1].trim();
          // Skip empty
          if (content === '') continue;
          // Check if label is quoted
          if (!content.startsWith('"')) {
            warnings.push({
              line: i + 1,
              message: 'Label not wrapped in double quotes',
              type: 'style',
            });
          }
        }
      }
    }
  }

  return warnings;
}

// ─── Main Function ────────────────────────────────────────

/**
 * Validate Mermaid diagram text cho syntax va style compliance.
 * @param {string} mermaidText - Noi dung Mermaid diagram
 * @param {object} [options] - Tuy chon (reserved for future use)
 * @returns {{ valid: boolean, errors: Array<{line: number, message: string, type: string}>, warnings: Array<{line: number, message: string, type: string}> }}
 */
function mermaidValidator(mermaidText, options = {}) {
  if (!mermaidText || !mermaidText.trim()) {
    return {
      valid: false,
      errors: [{ line: 1, message: 'Empty or whitespace-only input', type: 'syntax' }],
      warnings: [],
    };
  }

  const lines = mermaidText.split('\n');
  const errors = [];
  const warnings = [];

  // Syntax checks -> errors
  errors.push(...checkDeclaration(lines));
  errors.push(...checkUnclosedQuotes(lines));
  errors.push(...checkReservedKeywords(lines));

  // Style checks -> warnings
  warnings.push(...checkPalette(lines));
  warnings.push(...checkNodeCount(lines));
  warnings.push(...checkLabelQuoting(lines));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Exports ──────────────────────────────────────────────

module.exports = { mermaidValidator };
