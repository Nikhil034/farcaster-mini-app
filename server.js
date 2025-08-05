// server.js - Main Frame Server
const express = require('express');
const cors = require('cors');
const { getSSLHubRpcClient, Message } = require('@farcaster/hub-nodejs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Farcaster Hub client
const client = getSSLHubRpcClient('https://nemes.farcaster.xyz:2283');

// Frame state management (in production, use a database)
let gameState = {
  score: 0,
  clicks: 0,
  lastAction: 'start'
};

// Utility function to generate Frame HTML
function generateFrameHTML(title, image, buttons, postUrl) {
    console.log('Generating Frame HTML:', { title, image, buttons, postUrl });
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      
      <!-- Frame Meta Tags -->
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:title" content="${title}" />
      <meta property="fc:frame:image" content="${image}" />
      <meta property="fc:frame:post_url" content="${postUrl}" />
      
      ${buttons.map((button, index) => 
        `<meta property="fc:frame:button:${index + 1}" content="${button}" />`
      ).join('\n      ')}
      
      <!-- Open Graph Tags -->
      <meta property="og:title" content="${title}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:description" content="Interactive Farcaster Frame" />
    </head>
    <body>
      <h1>${title}</h1>
      <img src="${image}" alt="Frame Image" style="max-width: 100%; height: auto;" />
      <div>
        <p>This is a Farcaster Frame. Interact with it in a Farcaster client!</p>
        <p>Current Score: ${gameState.score}</p>
        <p>Total Clicks: ${gameState.clicks}</p>
      </div>
    </body>
    </html>
  `;
}

// Main Frame endpoint
app.get('/', (req, res) => {
  const html = generateFrameHTML(
    'Farcaster Mini Game',
    `${getBaseUrl(req)}/image/start`,
    ['🎮 Start Game', '📊 View Stats'],
    `${getBaseUrl(req)}/frame`
  );
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Frame interaction handler
app.post('/frame', async (req, res) => {
  try {
    console.log('Frame interaction received:', req.body);
    
    // Validate the Frame message (simplified validation)
    const { untrustedData, trustedData } = req.body;
    
    if (!untrustedData || !trustedData) {
      return res.status(400).json({ error: 'Invalid frame data' });
    }

    const buttonIndex = untrustedData.buttonIndex;
    const fid = untrustedData.fid;
    
    // Update game state based on button pressed
    let responseTitle = 'Farcaster Mini Game';
    let responseImage = `${getBaseUrl(req)}/image/start`;
    let responseButtons = ['🎮 Play Again', '📊 View Stats'];
    
    gameState.clicks++;
    
    switch (buttonIndex) {
      case 1: // Start Game / Play Again
        gameState.score += Math.floor(Math.random() * 10) + 1;
        gameState.lastAction = 'play';
        responseTitle = 'Game Result!';
        responseImage = `${getBaseUrl(req)}/image/result`;
        responseButtons = ['🎮 Play Again', '📊 View Stats', '🏠 Home'];
        break;
        
      case 2: // View Stats
        gameState.lastAction = 'stats';
        responseTitle = 'Game Statistics';
        responseImage = `${getBaseUrl(req)}/image/stats`;
        responseButtons = ['🎮 Play Game', '🔄 Refresh', '🏠 Home'];
        break;
        
      case 3: // Home
        gameState.lastAction = 'home';
        responseTitle = 'Farcaster Mini Game';
        responseImage = `${getBaseUrl(req)}/image/start`;
        responseButtons = ['🎮 Start Game', '📊 View Stats'];
        break;
        
      default:
        responseButtons = ['🎮 Start Game', '📊 View Stats'];
    }
    
    const html = generateFrameHTML(
      responseTitle,
      responseImage,
      responseButtons,
      `${getBaseUrl(req)}/frame`
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('Frame interaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dynamic image generation endpoints
app.get('/image/start', (req, res) => {
  const svg = generateGameImage('🚀 Welcome to Farcaster Mini Game!', 'Click Start to begin playing', '#4f46e5');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

app.get('/image/result', (req, res) => {
  const svg = generateGameImage(
    `🎉 You scored ${gameState.score - (gameState.clicks > 1 ? Math.floor(Math.random() * 10) + 1 : 0)} points!`, 
    `Total Score: ${gameState.score}`, 
    '#059669'
  );
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

app.get('/image/stats', (req, res) => {
  const svg = generateGameImage(
    '📊 Game Statistics', 
    `Total Score: ${gameState.score}\nTotal Clicks: ${gameState.clicks}\nLast Action: ${gameState.lastAction}`, 
    '#dc2626'
  );
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Utility function to generate SVG images
function generateGameImage(title, subtitle, color) {
  return `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="600" height="400" fill="url(#grad)" />
      
      <text x="300" y="150" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="32" font-weight="bold" fill="white">${title}</text>
      
      <text x="300" y="200" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="18" fill="white" opacity="0.9">${subtitle.split('\n')[0]}</text>
      
      ${subtitle.includes('\n') ? subtitle.split('\n').slice(1).map((line, i) => 
        `<text x="300" y="${230 + (i * 25)}" text-anchor="middle" font-family="Arial, sans-serif" 
               font-size="16" fill="white" opacity="0.8">${line}</text>`
      ).join('') : ''}
      
      <circle cx="300" cy="320" r="30" fill="white" opacity="0.2" />
      <text x="300" y="330" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="24" fill="white">🎮</text>
    </svg>
  `;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    gameState: gameState 
  });
});

// Reset game state (for testing)
app.post('/reset', (req, res) => {
  gameState = {
    score: 0,
    clicks: 0,
    lastAction: 'start'
  };
  res.json({ message: 'Game state reset', gameState });
});

// Utility function to get base URL
function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

app.listen(PORT, () => {
  console.log(`🚀 Farcaster Frame server running on port ${PORT}`);
  console.log(`📱 Frame URL: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;