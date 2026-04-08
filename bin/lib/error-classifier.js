'use strict';

/**
 * Classify an installer error into a structured result for clean terminal output.
 * Zero dependencies — pure function using only err.code, err.message, err.path.
 *
 * @param {Error|{code?: string, message?: string, path?: string}} err
 * @returns {{ category: string, message: string, hint: string }}
 */
function classifyError(err) {
  // WR-02: guard against null/non-object throws (e.g. `throw null`)
  if (err == null || typeof err !== 'object') {
    return {
      category: 'GENERIC',
      message: String(err),
      hint: 'Run with PD_DEBUG=1 for more details',
    };
  }

  const code = err.code || '';
  // WR-03: handle empty err.message gracefully
  const msg = (err.message != null && err.message !== '')
    ? err.message
    : err.stack || String(err) || '(no message)';

  // 1. Permission errors
  if (code === 'EACCES' || code === 'EPERM') {
    return {
      category: 'PERMISSION',
      message: msg,
      hint: err.path
        ? 'Fix: sudo chown $(whoami) ' + err.path
        : 'Check file permissions in your home directory',
    };
  }

  // 2. Missing native module / platform not supported
  if (code === 'MODULE_NOT_FOUND') {
    return {
      category: 'PLATFORM_UNSUPPORTED',
      message: msg,
      hint: 'This platform is not yet supported. See: https://github.com/tonamson/please-done for supported platforms',
    };
  }

  // 3. Missing dependency (message regex)
  if (/not installed|not found|requires|missing/i.test(msg)) {
    const urlMatch = msg.match(/(https?:\/\/[^\s]+)/);
    // WR-01: strip trailing punctuation from captured URL
    const url = urlMatch ? urlMatch[1].replace(/[.,;:)>\]'"!?]+$/, '') : null;
    return {
      category: 'MISSING_DEP',
      message: msg,
      hint: url
        ? 'Install via: ' + url
        : 'Install the missing dependency and re-run the installer',
    };
  }

  // 4. Generic fallback
  return {
    category: 'GENERIC',
    message: msg,
    hint: 'Run with PD_DEBUG=1 for more details',
  };
}

module.exports = { classifyError };
