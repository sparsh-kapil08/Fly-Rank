const { spawn } = require('child_process');

console.log('Starting API Server and Swagger UI...');

// Start the real API server (server.js) on port 3000
const api = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });

// Start the Swagger UI documentation server (swagger.js) on port 3001
const swagger = spawn('node', ['swagger.js'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  api.kill();
  swagger.kill();
  process.exit();
});
