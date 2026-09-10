import { app } from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` EUROSHUB KITCHEN API SERVER RUNNING`);
  console.log(` Port:     ${config.port}`);
  console.log(` Mode:     ${config.nodeEnv}`);
  console.log(` Frontend: ${config.frontendUrl}`);
  console.log(` API Docs: http://localhost:${config.port}/api/health`);
  console.log(`====================================================`);
});

const gracefulShutdown = () => {
  console.log('Shutting down API server gracefully...');
  server.close(() => {
    console.log('API server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
