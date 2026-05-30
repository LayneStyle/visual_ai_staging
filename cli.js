#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const args = process.argv.slice(2);
const command = args[0];

if (command === '--version' || command === '-v') {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    console.log(pkg.version);
  } catch (err) {
    console.error('Error reading package.json:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

if (command === '--help' || command === '-h' || !command) {
  console.log(`
Usage: vais [options] [command]

Options:
  -v, --version  Output the version number
  -h, --help     Output usage information

Commands:
  init           Initialize Visual AI Staging workspace (.ai-staging/ directories)
  dev            Start the Visual AI Staging native development server
`);
  process.exit(0);
}

if (command === 'init') {
  const resolvedBase = path.resolve(__dirname);
  const audioDir = path.join(resolvedBase, '.ai-staging', 'audio');
  const feedbackDir = path.join(resolvedBase, '.ai-staging', 'feedback');
  
  try {
    let alreadyExists = fs.existsSync(audioDir) && fs.existsSync(feedbackDir);
    
    fs.mkdirSync(audioDir, { recursive: true });
    fs.mkdirSync(feedbackDir, { recursive: true });
    
    // Create .gitkeep to ensure empty directories are tracked by Git
    const gitkeepAudio = path.join(audioDir, '.gitkeep');
    const gitkeepFeedback = path.join(feedbackDir, '.gitkeep');
    
    if (!fs.existsSync(gitkeepAudio)) fs.writeFileSync(gitkeepAudio, '');
    if (!fs.existsSync(gitkeepFeedback)) fs.writeFileSync(gitkeepFeedback, '');
    
    if (alreadyExists) {
      console.log('Visual AI Staging environment already initialized in this workspace.');
    } else {
      console.log('Successfully initialized Visual AI Staging workspace!');
      console.log('Created directories:');
      console.log('  - .ai-staging/audio/');
      console.log('  - .ai-staging/feedback/');
    }
  } catch (err) {
    console.error('Error initializing workspace:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

if (command === 'dev') {
  const port = 3000;
  const resolvedBase = path.resolve(__dirname);

  // Auto-initialize directories silently on server startup if they do not exist
  const audioDir = path.join(resolvedBase, '.ai-staging', 'audio');
  const feedbackDir = path.join(resolvedBase, '.ai-staging', 'feedback');
  try {
    fs.mkdirSync(audioDir, { recursive: true });
    fs.mkdirSync(feedbackDir, { recursive: true });
    
    const gitkeepAudio = path.join(audioDir, '.gitkeep');
    const gitkeepFeedback = path.join(feedbackDir, '.gitkeep');
    if (!fs.existsSync(gitkeepAudio)) fs.writeFileSync(gitkeepAudio, '');
    if (!fs.existsSync(gitkeepFeedback)) fs.writeFileSync(gitkeepFeedback, '');
  } catch (err) {
    console.warn('Warning: Failed to auto-initialize staging directories on startup:', err.message);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle POST /api/save-audio?filename=<encoded_filename>
    if (req.method === 'POST' && pathname === '/api/save-audio') {
      const rawFilename = parsedUrl.query.filename || '';
      const filename = path.basename(rawFilename);
      const wavPattern = /^[a-zA-Z0-9_\-\.]+\.wav$/;

      if (!wavPattern.test(filename)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Invalid filename. Must match ^[a-zA-Z0-9_\\-\\.]+\\.wav$' }));
        return;
      }

      const targetDir = path.join(resolvedBase, '.ai-staging', 'audio');
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Failed to create audio storage directory' }));
        return;
      }

      const targetPath = path.join(targetDir, filename);
      const writeStream = fs.createWriteStream(targetPath);

      req.pipe(writeStream);

      writeStream.on('finish', () => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, path: targetPath }));
      });

      writeStream.on('error', (err) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
      return;
    }

    // Handle POST /api/save-feedback
    if (req.method === 'POST' && pathname === '/api/save-feedback') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const rawFilename = payload.filename || '';
          const filename = path.basename(rawFilename);
          const mdPattern = /^[a-zA-Z0-9_\-\.]+\.md$/;

          if (!mdPattern.test(filename)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Invalid filename. Must match ^[a-zA-Z0-9_\\-\\.]+\\.md$' }));
            return;
          }

          const targetDir = path.join(resolvedBase, '.ai-staging', 'feedback');
          try {
            fs.mkdirSync(targetDir, { recursive: true });
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Failed to create feedback storage directory' }));
            return;
          }

          const targetPath = path.join(targetDir, filename);
          fs.writeFileSync(targetPath, payload.content || '');

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, path: targetPath }));
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
        }
      });
      return;
    }

    // Handle static files serving (GET)
    if (req.method === 'GET') {
      let relativePath = pathname;
      if (relativePath === '/') {
        relativePath = '/index.html';
      }

      const resolvedPath = path.resolve(path.join(resolvedBase, relativePath));

      // Path traversal security check
      if (!resolvedPath.startsWith(resolvedBase)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('403 Forbidden: Path traversal detected.');
        return;
      }

      fs.stat(resolvedPath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('404 Not Found');
          return;
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.wav': 'audio/wav',
          '.md': 'text/markdown',
          '.json': 'application/json',
          '.txt': 'text/plain'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        fs.createReadStream(resolvedPath).pipe(res);
      });
      return;
    }

    // Method not supported fallback
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.end('405 Method Not Allowed');
  });

  server.listen(port, () => {
    console.log(`Visual AI Staging Dev Server running at http://localhost:${port}/`);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "vais --help" for usage.');
  process.exit(1);
}
