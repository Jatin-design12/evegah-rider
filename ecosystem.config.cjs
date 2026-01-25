module.exports = {
  apps: [
    {
      name: "evegah-api",
      script: "server/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
