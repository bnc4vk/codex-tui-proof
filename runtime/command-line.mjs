export function parseCommandLine(input) {
  const source = String(input).trim();
  if (!source) throw new Error('Command cannot be empty');

  const tokens = [];
  let token = '';
  let tokenStarted = false;
  let quote = null;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (char === quote) {
        quote = null;
        tokenStarted = true;
      } else if (char === '\\' && quote === '"' && index + 1 < source.length) {
        const next = source[index + 1];
        if (next === '"' || next === '\\') {
          token += next;
          tokenStarted = true;
          index += 1;
        } else {
          token += char;
          tokenStarted = true;
        }
      } else {
        token += char;
        tokenStarted = true;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      tokenStarted = true;
      continue;
    }

    if (/\s/.test(char)) {
      if (tokenStarted) {
        tokens.push(token);
        token = '';
        tokenStarted = false;
      }
      continue;
    }

    if (char === '\\' && index + 1 < source.length) {
      const next = source[index + 1];
      if (/\s/.test(next) || next === '"' || next === "'" || next === '\\') {
        token += next;
        tokenStarted = true;
        index += 1;
        continue;
      }
    }

    token += char;
    tokenStarted = true;
  }

  if (quote) throw new Error(`Unterminated ${quote} quote in command`);
  if (tokenStarted) tokens.push(token);
  if (!tokens.length) throw new Error('Command cannot be empty');
  return tokens;
}
