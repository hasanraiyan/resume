const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ismaster: true, ok: 1 }));
});

server.listen(27017, () => {
  console.log('Mock MongoDB running on port 27017');
});
