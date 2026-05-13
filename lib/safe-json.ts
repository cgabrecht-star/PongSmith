/**
 * Safe JSON stringification für dangerouslySetInnerHTML in script-Tags.
 *
 * JSON.stringify allein reicht nicht. Wenn ein String "</script>" enthält,
 * kann ein Angreifer aus dem script-Tag ausbrechen und beliebigen JS-Code
 * injizieren. Wir escapen daher die kritischen Zeichen vor dem Einfügen.
 *
 * Output: gültiges JSON, aber gefährliche Zeichen als Unicode-Escape.
 * Quelle: OWASP XSS Prevention Cheat Sheet, Rule #3
 *
 * Hinweis: Wir nutzen application/ld+json (kein JS-Code), daher sind
 * Line-/Paragraph-Separator (\\u2028, \\u2029) hier kein Risiko.
 */
const BS = String.fromCharCode(92); // Backslash

export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, BS + "u003c")
    .replace(/>/g, BS + "u003e")
    .replace(/&/g, BS + "u0026");
}
