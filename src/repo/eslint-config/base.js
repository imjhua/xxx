import js from "@eslint/js";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import stylistic from "@stylistic/eslint-plugin";

export const OFF = 0;
export const WARN = 1;
export const ERROR = 2;

/**
 * ESLint shared config (Stylistic v5+)
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**"],
  },
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": ERROR,
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    plugins: {
      "simple-import-sort": pluginSimpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": ERROR,
      "simple-import-sort/exports": ERROR,
    },
  },
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // General
      "@stylistic/space-in-parens": [ERROR, "never"],
      "@stylistic/semi": [ERROR, "never"],
      "@stylistic/semi-spacing": ERROR,
      "@stylistic/indent": [ERROR, 2],
      "@stylistic/space-infix-ops": ERROR,
      "@stylistic/array-bracket-newline": [ERROR, "consistent"],
      "@stylistic/array-bracket-spacing": ERROR,
      "@stylistic/arrow-spacing": ERROR,
      "@stylistic/arrow-parens": ERROR,
      "@stylistic/comma-dangle": ERROR,
      "@stylistic/comma-spacing": ERROR,
      "@stylistic/object-curly-spacing": [ERROR, "always"],
      "@stylistic/space-before-blocks": [ERROR, {
          "functions": "never",
          "classes": "never"
      }],
      "@stylistic/keyword-spacing": [ERROR, { "overrides": {
          "if": { "after": false }
        } 
      }],
      "@stylistic/type-annotation-spacing": ERROR,
      "@stylistic/member-delimiter-style": [
        ERROR,
        {
          multiline: {
            delimiter: "semi",
            requireLast: true,
          },
          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
        },
      ],
      "@stylistic/operator-linebreak": [
        ERROR,
        "before",
        {
          overrides: {
            "?": "before",
            ":": "before",
          },
        },
      ],

      // JavaScript formatting
      "@stylistic/quotes": [ERROR, "single"],
      "@stylistic/no-multi-spaces": ERROR,
      "@stylistic/brace-style": ERROR,
      "@stylistic/no-trailing-spaces": ERROR,
      "@stylistic/array-element-newline": [ERROR, { consistent: true }],
      "@stylistic/no-multiple-empty-lines": [
        ERROR,
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 0,
        },
      ],
      "@stylistic/key-spacing": ERROR,
      "@stylistic/object-curly-newline": [
        ERROR,
        {
          ObjectExpression: {
            multiline: true,
            minProperties: 4,
            consistent: true,
          },
          ImportDeclaration: {
            multiline: true,
            minProperties: 8,
            consistent: true,
          },
        },
      ],

      // JSX
      "@stylistic/jsx-first-prop-new-line": ERROR,
      "@stylistic/jsx-curly-brace-presence": ERROR,
      "@stylistic/jsx-tag-spacing": [ERROR, {
        closingSlash: "never",   // 셀프 클로징 시 / 앞 공백 없음: <img />
        beforeSelfClosing: "always", // 셀프 클로징 직전엔 공백 있음: <img />
        afterOpening: "never",   // opening tag 직후 공백 없음: <Card>
        beforeClosing: "never"   // closing > 앞 공백 없음: <Card>
      }],
      "@stylistic/jsx-closing-bracket-location": ERROR,
      "@stylistic/jsx-closing-tag-location": [ERROR, "line-aligned"],
      "@stylistic/jsx-curly-spacing": ERROR,
      // "@stylistic/jsx-indent": [ERROR, 2],
      "@stylistic/jsx-indent-props": [ERROR, 2],
      // 형제 JSX 사이 빈 줄 금지. </div>\n\n<div> → 에러, </div>\n<div> → OK
      "@stylistic/jsx-newline": [ERROR, { prevent: true }],
      "@stylistic/jsx-wrap-multilines": [
        ERROR,
        {
          declaration: "parens-new-line",
          assignment: "parens-new-line",
          return: "parens-new-line",
          arrow: "parens-new-line",
          condition: "parens-new-line",
          logical: "parens-new-line",
          prop: "parens-new-line",
          propertyValue: "parens-new-line",
        },
      ],
    },
  },
  {
    rules: {
      curly: ERROR,
      "no-console": [ERROR, { allow: ["warn", "error"] }],
    },
  },
];
