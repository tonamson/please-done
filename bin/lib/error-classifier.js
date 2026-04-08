'use strict';

/**
 * Classify an installer error into a structured result for clean terminal output.
 * Zero dependencies — pure function using only err.code, err.message, err.path.
 *
 * @param {Error|{code?: string, message?: string, path?: string}} err
 * @returns {{ category: string, message: string, hint: string }}
 */
function classifyError(err) {
  const code = err.code || '';
  const msg  = err.message || String(err);

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
    return {
      category: 'MISSING_DEP',
      message: msg,
      hint: urlMatch
        ? 'Install via: ' + urlMatch[1]
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
