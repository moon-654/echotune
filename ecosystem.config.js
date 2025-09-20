module.exports = {
  apps: [{
    name: 'echotune',
    script: 'npm',
    args: 'run dev',
    cwd: './EchoTune',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    }
  }]
};

