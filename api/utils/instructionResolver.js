class InstructionResolver {
  constructor() {
    this.patterns = [];

    // Register default patterns
    this.registerPattern(
      'numbered-list',
      /(\d+\.\s*)/, // Detection regex: Match number, dot, and optional space
      (text) => {
        // Split by number followed by dot and optional space
        // Matches "1. Step One 2.Step Two"

        const parts = text.split(/(\d+\.\s*)/).filter((p) => p.trim());
        const steps = [];

        let i = 0;
        while (i < parts.length) {
          // If part is the number indicator (e.g. "1. " or "2."), skip or verify
          if (/^\d+\.\s*$/.test(parts[i])) {
            // The next part is the content
            if (parts[i + 1]) {
              steps.push({
                step: Number.parseInt(parts[i], 10),
                instruction: parts[i + 1].trim()
              });
              i++; // Skip content
            }
          } else {
            // If we found content without a preceding number (start of string text?)
            // For now, treat as unnumbered step or prelude
            steps.push({ step: 0, instruction: parts[i].trim() });
          }
          i++;
        }

        return steps.map((s) => s.instruction);
      }
    );

    // Register sentence list pattern (Period + Space + Uppercase)
    this.registerPattern(
      'sentence-list',
      /\.\s+(?=[A-Z])/, // Matches period, space, lookahead for Uppercase
      (text) => {
        // Split by period + space (keeping the lookahead logic implies we split at the period)
        // split(/\.\s+(?=[A-Z])/) consumes the period and space.
        // "Step one. Step two" -> ["Step one", "Step two"]

        const parts = text.split(/\.\s+(?=[A-Z])/).filter((p) => p.trim());
        return parts.map((p) => {
          // Ensure no trailing dots if they were left (split usually consumes the separator)
          // But we might want to ensure we don't stripping necessary punctuation?
          // Actually, if we split "Walk. Run", "Walk" loses the dot. "Run" keeps whatever it has.
          return p.trim();
        });
      }
    );
  }

  registerPattern(name, regex, handler) {
    this.patterns.push({ name, regex, handler });
  }

  resolve(text) {
    if (!text) return [];
    if (typeof text !== 'string') return [text];

    const trimmed = text.trim();

    for (const pattern of this.patterns) {
      if (pattern.regex.test(trimmed)) {
        try {
          return pattern.handler(trimmed);
        } catch (e) {
          console.error(`Error pattern '${pattern.name}':`, e);
        }
      }
    }

    // Default: Return as single item if no pattern matches
    return [trimmed];
  }
}

export default new InstructionResolver();
