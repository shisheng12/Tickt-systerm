const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let filePath = req.url;
  
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  filePath = path.join(DIST_DIR, filePath);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n🚀 客服工单系统静态服务器已启动');
  console.log(`📍 访问地址: http://127.0.0.1:${PORT}`);
  console.log(`📍 或: http://localhost:${PORT}`);
  console.log('\n📋 验证步骤:');
  console.log('1. 在浏览器中打开上述地址');
  console.log('2. 选择角色登录（管理员/R_ADMIN 可查看完整功能）');
  console.log('3. 验证各模块页面是否正常加载');
  console.log('\n按 Ctrl+C 停止服务器');
});
