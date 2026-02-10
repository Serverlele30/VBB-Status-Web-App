const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mimeTypes = require('mime-types');

const PORT = 3000;
const CERT_DIR = path.join(__dirname, 'certs');
const CERT_FILE = path.join(CERT_DIR, 'cert.pem');
const KEY_FILE = path.join(CERT_DIR, 'key.pem');

// Create certs directory if it doesn't exist
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR);
}

// Generate self-signed certificate if it doesn't exist
if (!fs.existsSync(CERT_FILE) || !fs.existsSync(KEY_FILE)) {
    console.log('🔐 Generating self-signed SSL certificate...');
    try {
        execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -days 365 -nodes -subj "/CN=localhost"`, {
            stdio: 'inherit'
        });
        console.log('✅ Certificate generated successfully!');
    } catch (error) {
        console.error('❌ Error generating certificate:', error.message);
        console.log('📝 Please install OpenSSL or create certificates manually.');
        process.exit(1);
    }
}

// HTTPS server options
const options = {
    key: fs.readFileSync(KEY_FILE),
    cert: fs.readFileSync(CERT_FILE)
};

// Create HTTPS server
const server = https.createServer(options, (req, res) => {
    // Remove query parameters and get clean path
    let filePath = req.url.split('?')[0];
    
    // Default to index.html for root
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Construct full file path
    const fullPath = path.join(__dirname, filePath);
    
    // Security check: prevent directory traversal
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        // Get MIME type
        const mimeType = mimeTypes.lookup(fullPath) || 'application/octet-stream';
        
        // Read and serve file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading file');
                return;
            }
            
            // Set appropriate headers
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        });
    });
});

// Start server
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 VBB Netz Status - HTTPS Development Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Server running at: https://localhost:${PORT}`);
    console.log('');
    console.log('📱 To test on mobile:');
    console.log('   1. Find your local IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
    console.log('   2. Open https://YOUR_IP:3000 on your mobile device');
    console.log('   3. Accept the self-signed certificate warning');
    console.log('');
    console.log('⚠️  Note: Your browser will show a security warning.');
    console.log('   This is normal for self-signed certificates in development.');
    console.log('   Click "Advanced" → "Proceed to localhost" to continue.');
    console.log('');
    console.log('🛑 Press Ctrl+C to stop the server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
