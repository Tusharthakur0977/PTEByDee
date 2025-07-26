module.exports = {
  apps: [
    {
      name: 'ptebydee-server',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
