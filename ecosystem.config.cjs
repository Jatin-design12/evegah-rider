module.exports = {
  apps: [
    {
      name: "evegah-api",
      script: "server/index.js",
      env: {
        NODE_ENV: "production",
        // If DigiLocker calls fail with "Connection reset by peer" during TLS handshake,
        // forcing TLS 1.2 can help in networks that break TLS 1.3.
        // NODE_OPTIONS: "--tls-max-v1.2 --tls-min-v1.2",
      },
    },
  ],
};
