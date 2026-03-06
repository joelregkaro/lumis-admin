const port = process.env.PORT || 3001;

module.exports = {
  apps: [
    {
      name: "lumis-admin",
      cwd: __dirname,
      script: "npm",
      args: `start -- --port ${port} --hostname 0.0.0.0`,
      instances: 1,
      exec_mode: "fork",
      min_uptime: "10s",
      max_restarts: 3,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: port,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};