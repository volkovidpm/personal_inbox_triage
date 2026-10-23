import { readFileSync } from "node:fs";
import { tokensToCss } from "./build-tokens.mjs";

const sample = JSON.parse(readFileSync("design/tokens.json", "utf8"));

describe("tokensToCss", () => {
  const css = tokensToCss(sample);

  it("кладёт светлую тему на :root", () => {
    expect(css).toContain(":root {");
    expect(css).toContain("--paper: #f4f7f6;");
  });

  it("кладёт тёмную тему под prefers-color-scheme с защитой от явной светлой", () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{[^}]*--paper: #0f1513;/);
  });

  it("повторяет тёмную тему под data-theme=dark", () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \{[^}]*--paper: #0f1513;[^}]*color-scheme: dark;/);
  });

  it("выводит отступы, радиусы и семейства шрифтов", () => {
    expect(css).toContain("--space-4: 16px;");
    expect(css).toContain("--radius-pill: 999px;");
    expect(css).toContain('--font-mono: "JetBrains Mono"');
  });

  it("делает класс на каждый стиль текста", () => {
    expect(css).toMatch(/\.t-label \{[^}]*letter-spacing: 0\.06em;/);
    expect(css).toMatch(/\.t-reading \{[^}]*font-family: var\(--font-mono\);[^}]*font-size: 20px;/);
  });
});
