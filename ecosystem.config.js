module.exports = {
  apps: [
    {
      name: "friendsofbarca",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/friendsofbarca",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
