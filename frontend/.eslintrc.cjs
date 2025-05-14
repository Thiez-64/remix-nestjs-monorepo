// /** @type {import("eslint").Linter.Config} */
// module.exports = {
//   root: true,
//   extends: [
//     "@thiez-64/eslint-config/base.js",
//     "@remix-run/eslint-config",
//     "@remix-run/eslint-config/node",
//     // "plugin:tailwindcss/recommended",
//     "plugin:remix-react-routes/recommended",
//   ],
//   settings: {
//     // tailwindcss: {
//     //   config: "tailwind.config.ts",
//     // },
//     "import/resolver": {
//       node: {
//         extensions: [".js", ".jsx", ".ts", ".tsx"],
//       },
//     },
//   },

//   overrides: [
//     {
//       extends: ["@remix-run/eslint-config/jest-testing-library"],
//       files: ["app/**/__tests__/**/*", "app/**/*.{spec,test}.*"],
//       rules: {
//         "testing-library/no-await-sync-events": "off",
//         "jest-dom/prefer-in-document": "off",
//       },
//       // we're using vitest which has a very similar API to jest
//       // (so the linting plugins work nicely), but it means we have to explicitly
//       // set the jest version.
//       settings: {
//         jest: {
//           version: 28,
//         },
//       },
//     },
//   ],
// };
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  ignorePatterns: ["!**/.server", "!**/.client"],

  // Base config
  extends: ["eslint:recommended"],

  overrides: [
    // React
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: ["react", "jsx-a11y"],
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
      ],
      settings: {
        react: {
          version: "detect",
        },
        formComponents: ["Form"],
        linkComponents: [
          { name: "Link", linkAttribute: "to" },
          { name: "NavLink", linkAttribute: "to" },
        ],
        "import/resolver": {
          typescript: {},
        },
      },
    },

    // Typescript
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
      ],
    },

    // Node
    {
      files: [".eslintrc.cjs"],
      env: {
        node: true,
      },
    },
  ],
};