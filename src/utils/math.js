/**
 * Safely evaluates a basic mathematical expression string.
 * Supports +, -, *, / and operator precedence.
 * Also handles unary plus and minus.
 * Does NOT use eval() or Function().
 *
 * @param {string} expr - The mathematical expression to evaluate.
 * @returns {number} The result of the evaluation.
 * @throws {Error} If the expression is invalid or contains unsupported characters.
 */
export function evaluateMath(expr) {
  const sanitized = expr.replace(/\s+/g, '');
  let pos = 0;

  function peek() {
    return sanitized[pos];
  }

  function consume() {
    return sanitized[pos++];
  }

  function parseNumber() {
    let start = pos;
    let hasDot = false;
    while (pos < sanitized.length) {
      const char = peek();
      if (char === '.') {
        if (hasDot) break;
        hasDot = true;
      } else if (!/[0-9]/.test(char)) {
        break;
      }
      consume();
    }
    const s = sanitized.substring(start, pos);
    if (s === '' || s === '.') throw new Error('Expected number');
    return parseFloat(s);
  }

  function parseFactor() {
    if (peek() === '-') {
      consume();
      return -parseFactor();
    }
    if (peek() === '+') {
      consume();
      return parseFactor();
    }
    return parseNumber();
  }

  function parseTerm() {
    let val = parseFactor();
    while (pos < sanitized.length) {
      const op = peek();
      if (op !== '*' && op !== '/') break;
      consume();
      const next = parseFactor();
      if (op === '*') {
        val *= next;
      } else {
        if (next === 0) throw new Error('Division by zero');
        val /= next;
      }
    }
    return val;
  }

  function parseExpression() {
    let val = parseTerm();
    while (pos < sanitized.length) {
      const op = peek();
      if (op !== '+' && op !== '-') break;
      consume();
      const next = parseTerm();
      if (op === '+') {
        val += next;
      } else {
        val -= next;
      }
    }
    return val;
  }

  if (!sanitized) return 0;
  const result = parseExpression();
  if (pos < sanitized.length) {
    throw new Error('Unexpected character at ' + pos);
  }
  return result;
}
