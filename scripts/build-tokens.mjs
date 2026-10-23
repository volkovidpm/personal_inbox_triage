// Собирает src/styles/tokens.css из design/tokens.json — копии токенов дизайн-системы.
// Первая тема — значения на :root, вторая (тёмная) — под prefers-color-scheme и под
// [data-theme="dark"], чтобы переключатель темы побеждал в обе стороны.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const decl = (name, value) => `  --${name}: ${value};`;

const STYLE_PROPS = [
  ["fontSize", "font-size"],
  ["lineHeight", "line-height"],
  ["fontWeight", "font-weight"],
  ["letterSpacing", "letter-spacing"],
];

/** @param {any} tokens содержимое tokens.json в формате дизайн-системы */
export function tokensToCss(tokens) {
  const [light, dark] = tokens.color.themes.map((t) => t.id);
  const colorFor = (theme) =>
    tokens.color.tokens.map((t) => decl(t.name, typeof t.value === "string" ? t.value : t.value[theme] ?? t.value[light]));

  const scalars = [...tokens.spacing.tokens, ...tokens.radius.tokens].map((t) => decl(t.name, t.value));
  const families = Object.entries(tokens.type.families).map(([key, stack]) => decl(`font-${key}`, stack));

  const darkBlock = [...colorFor(dark), "  color-scheme: dark;"].join("\n");
  const styles = tokens.type.groups.flatMap((group) =>
    group.styles.map((s) => {
      const lines = [`  font-family: var(--font-${s.family ?? group.family});`];
      for (const [key, prop] of STYLE_PROPS) if (s[key] !== undefined) lines.push(`  ${prop}: ${s[key]};`);
      return `.${s.name} {\n${lines.join("\n")}\n}`;
    })
  );

  return [
    `/* ${tokens.name} — generated from tokens.json */`,
    `:root {\n${[...colorFor(light), ...scalars, ...families].join("\n")}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${darkBlock.replace(/^/gm, "  ")}\n  }\n}`,
    `:root[data-theme="dark"] {\n${darkBlock}\n}`,
    ...styles,
    "",
  ].join("\n\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL("../", import.meta.url);
  const tokens = JSON.parse(readFileSync(new URL("design/tokens.json", root), "utf8"));
  writeFileSync(new URL("src/styles/tokens.css", root), tokensToCss(tokens));
}
