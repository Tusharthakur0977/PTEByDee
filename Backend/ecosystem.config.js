module.exports = {
  apps: [
    {
      name: 'ptebydee-server', // This must match the '--name' in your application_start.sh
      script: 'dist/server.js', // <--- CRITICAL: Confirm this is your main application entry file (e.g., 'app.js', 'server.js')
      instances: 'max', // Run as many instances as your CPU cores
      exec_mode: 'cluster', // Use PM2's cluster mode for better performance/load balancing
      // No 'env' or 'env_production' block is needed here,
      // as all environment variables are exported by the application_start.sh script
      // before PM2 starts the app.
      env_production: {
        // This block
        NODE_ENV: 'production',
      },
    },
  ],
};
