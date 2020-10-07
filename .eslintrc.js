module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "jest/globals": true
    },
    "extends": "eslint:recommended",
    "parser": 'babel-eslint',
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    plugins: [
        "flowtype",
        "jest",
    ],
    extends: [
        "plugin:flowtype/recommended"
    ],
    "rules": {
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        "flowtype/generic-spacing": 0
    }
};
