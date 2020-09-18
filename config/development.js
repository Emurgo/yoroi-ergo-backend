module.exports = {
  server: {
    port: 3001,
    corsOrigins: ['*'],
    corsAllowHeaders: ['yoroi-version', 'yoroi-locale'],
    corsExposeHeaders: ['yoroi-version', 'yoroi-locale'],
  },
  logLevel: 'debug',
  backend: {
    explorer: 'https://api.ergoplatform.com',
  },
};
