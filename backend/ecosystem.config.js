/**
 * PM2 生态系统配置文件
 * 用于生产环境部署
 */
module.exports = {
  apps: [
    {
      name: 'forum-api',
      script: './dist/app.js',
      instances: process.env.PM2_INSTANCES || 'max', // 使用所有CPU核心，或指定数量
      exec_mode: 'cluster', // 集群模式
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 日志配置
      error_file: '/var/log/forum/error.log',
      out_file: '/var/log/forum/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // 自动重启
      autorestart: true,
      watch: false,
      // 内存限制（超过500M自动重启）
      max_memory_restart: '500M',
      // 实例间负载均衡
      instance_var: 'INSTANCE_ID',
    },
  ],
};
