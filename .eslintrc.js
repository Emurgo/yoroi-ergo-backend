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
    "rules": {
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    }
};
