import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  {
    ignores: ["**/static/tabler.js"],
  },
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": "error",
      "max-len": [
        "error",
        {
          code: 80,
          ignoreComments: true,
          ignoreTrailingComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      // "max-lines-per-function": [
      //   "warn",
      //   {
      //     max: 100,
      //     skipBlankLines: true,
      //     skipComments: true,
      //   },
      // ],
    },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js"], // Match test files
    rules: {
      "max-lines-per-function": "off", // Disable the rule for test files
    },
  },
];
