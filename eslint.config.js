import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default defineConfig(
  {
    ignores: ["dist/**", "coverage/**", "sample-project/**", "node_modules/**", "eslint.config.js"],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Test files legitimately construct many small fixtures; Sonar's
      // duplicate-string threshold fires on repeated literals like "SHA-1"
      // across unrelated test cases, which is clearer than extracting a
      // constant for a one-line assertion.
      "sonarjs/no-duplicate-string": "off",
      // number/boolean are always safe to interpolate (no [object Object]
      // risk); everything else (objects, unions with undefined) still
      // requires an explicit, intentional conversion.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      // `strictTypeChecked` enables both `non-nullable-type-assertion-style`
      // (prefer `!` over `as T` to strip a nullable type) and
      // `no-non-null-assertion` (forbid `!` outright) — a direct
      // contradiction. This codebase resolves it in favor of `!`: every use
      // sits immediately after an explicit runtime bounds/length check, with
      // a comment stating the invariant that makes it safe.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      // Test doubles intentionally implement port interfaces without using
      // every parameter (e.g. a fake HmacProvider that only inspects
      // `message`), and RFC vector tables are naturally long literals.
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
      // vitest's `expect.any()`/`expect.anything()` are typed to return
      // `any` by design; that's a testing-library typing limitation, not a
      // real type-safety hole in application code.
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  {
    files: ["*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  }
);
