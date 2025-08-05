// server.js - Fixed Mini App Server
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Game state
let gameStats = {
  totalClicks: 0,
  highScore: 0,
  playerCount: 0,
  recentScores: []
};

// Mini App Embed Configuration
function getMiniAppEmbed(req) {
  const baseUrl = getBaseUrl(req);
  
  return {
    version: "1",
    imageUrl: `${baseUrl}/api/image/preview`,
    button: {
      title: "🎮 Play Game",
      action: {
        type: "launch_frame",
        name: "Space Clicker",
        url: `${baseUrl}/app`,
        splashImageUrl: `${baseUrl}/api/image/splash`,
        splashBackgroundColor: "#1a1a2e"
      }
    }
  };
}

// Main frame endpoint
app.get('/', (req, res) => {
  const embed = getMiniAppEmbed(req);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Clicker - Farcaster Mini App</title>
  
  <!-- Mini App Meta Tags -->
  <meta name="fc:miniapp" content='${JSON.stringify(embed)}' />
  <meta name="fc:frame" content='${JSON.stringify(embed)}' />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Space Clicker Game" />
  <meta property="og:description" content="Click to explore space! Challenge your friends!" />
  <meta property="og:image" content="${embed.imageUrl}" />
  <meta property="og:type" content="website" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      max-width: 600px;
      background: rgba(255,255,255,0.1);
      padding: 40px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    .stats {
      background: rgba(0,0,0,0.2);
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .test-button {
      background: #00ff88;
      color: #000;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      margin: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Space Clicker</h1>
    <p>Interactive clicking game for Farcaster!</p>
    
    <div class="stats">
      <h3>📊 Game Stats</h3>
      <p><strong>Total Clicks:</strong> ${gameStats.totalClicks}</p>
      <p><strong>High Score:</strong> ${gameStats.highScore}</p>
      <p><strong>Players:</strong> ${gameStats.playerCount}</p>
    </div>
    
    <p><strong>🎯 How to play:</strong></p>
    <p>1. Share this URL in a Farcaster cast</p>
    <p>2. Click the "Play Game" button in the frame</p>
    <p>3. Click as fast as you can in 30 seconds!</p>
    
    <a href="/app" class="test-button">🔗 Test Web Version</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Mini App page
app.get('/app', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Clicker Game</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e);
      color: white;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }
    
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
    }
    
    .score-display {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #00ff88;
      text-shadow: 0 0 10px #00ff88;
    }
    
    .timer-display {
      font-size: 20px;
      margin-bottom: 20px;
      color: #ff6b6b;
    }
    
    .click-zone {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: radial-gradient(circle, #667eea, #764ba2);
      border: 4px solid #00ff88;
      font-size: 60px;
      cursor: pointer;
      transition: all 0.1s ease;
      margin: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
      user-select: none;
    }
    
    .click-zone:hover {
      transform: scale(1.05);
      box-shadow: 0 0 40px rgba(102, 126, 234, 0.8);
    }
    
    .click-zone:active {
      transform: scale(0.95);
    }
    
    .click-zone.pulsing {
      animation: pulse 0.1s ease-out;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .game-over {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    .action-button {
      background: linear-gradient(45deg, #00ff88, #00d4aa);
      color: #000;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin: 5px;
    }
    
    .leaderboard {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 10px;
      min-width: 150px;
      font-size: 14px;
    }
    
    .stars {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    }
    
    .instruction {
      margin-top: 20px;
      opacity: 0.8;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="stars" id="stars"></div>
  
  <div class="leaderboard">
    <h4>🏆 Top Scores</h4>
    <div id="leaderboard-content">Loading...</div>
  </div>
  
  <div class="game-container">
    <div id="game-play">
      <div class="score-display">Score: <span id="score">0</span></div>
      <div class="timer-display">Time: <span id="timer">30</span>s</div>
      
      <div class="click-zone" id="clickZone">🚀</div>
      
      <div class="instruction">Click the rocket as fast as you can!</div>
    </div>
    
    <div class="game-over" id="gameOver">
      <h2>🎉 Game Complete!</h2>
      <div class="score-display">Final Score: <span id="finalScore">0</span></div>
      <div id="scoreMessage"></div>
      <button class="action-button" onclick="startNewGame()">🚀 Play Again</button>
      <button class="action-button" onclick="shareScore()">📱 Share Score</button>
    </div>
  </div>

  <!-- Use the latest Mini App SDK -->
  <script type="module">
    // Game state
    let gameState = {
      score: 0,
      timeLeft: 30,
      isPlaying: false,
      gameTimer: null
    };
    
    // DOM elements
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const clickZone = document.getElementById('clickZone');
    const gamePlay = document.getElementById('game-play');
    const gameOver = document.getElementById('gameOver');
    const finalScore = document.getElementById('finalScore');
    const scoreMessage = document.getElementById('scoreMessage');
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    // Create animated stars background
    function createStars() {
      const starsContainer = document.getElementById('stars');
      for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.style.cssText = \`
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          left: \${Math.random() * 100}%;
          top: \${Math.random() * 100}%;
          opacity: \${Math.random() * 0.8 + 0.2};
          animation: twinkle \${Math.random() * 3 + 1}s infinite;
        \`;
        starsContainer.appendChild(star);
      }
      
      // Add twinkle animation
      if (!document.getElementById('star-styles')) {
        const style = document.createElement('style');
        style.id = 'star-styles';
        style.textContent = \`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
        \`;
        document.head.appendChild(style);
      }
    }
    
    // Game functions
    function startNewGame() {
      gameState.score = 0;
      gameState.timeLeft = 30;
      gameState.isPlaying = true;
      
      updateDisplay();
      showGamePlay();
      
      // Start countdown
      gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        timerEl.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
          endGame();
        }
      }, 1000);
    }
    
    function endGame() {
      gameState.isPlaying = false;
      clearInterval(gameState.gameTimer);
      
      finalScore.textContent = gameState.score;
      
      // Score message based on performance
      if (gameState.score >= 150) {
        scoreMessage.textContent = "🌟 INCREDIBLE! You're a space legend!";
      } else if (gameState.score >= 100) {
        scoreMessage.textContent = "🚀 AMAZING! You're a natural!";
      } else if (gameState.score >= 50) {
        scoreMessage.textContent = "⭐ GOOD JOB! Keep practicing!";
      } else {
        scoreMessage.textContent = "🌍 Nice try! You'll get better!";
      }
      
      showGameOver();
      submitScore(gameState.score);
    }
    
    function handleClick() {
      if (!gameState.isPlaying) return;
      
      gameState.score++;
      updateDisplay();
      
      // Visual feedback
      clickZone.classList.add('pulsing');
      setTimeout(() => clickZone.classList.remove('pulsing'), 100);
      
      // Occasionally change the emoji
      const emojis = ['🚀', '🛸', '⭐', '💫', '🌟'];
      if (Math.random() < 0.1) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        clickZone.textContent = randomEmoji;
        setTimeout(() => clickZone.textContent = '🚀', 300);
      }
    }
    
    function updateDisplay() {
      scoreEl.textContent = gameState.score;
      timerEl.textContent = gameState.timeLeft;
    }
    
    function showGamePlay() {
      gamePlay.style.display = 'block';
      gameOver.style.display = 'none';
    }
    
    function showGameOver() {
      gamePlay.style.display = 'none';
      gameOver.style.display = 'flex';
    }
    
    async function submitScore(score) {
      try {
        const response = await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score })
        });
        
        if (response.ok) {
          await loadLeaderboard();
        }
      } catch (error) {
        console.warn('Could not submit score:', error);
      }
    }
    
    async function loadLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        const topScores = data.recentScores
          .sort((a, b) => b - a)
          .slice(0, 5);
          
        leaderboardContent.innerHTML = topScores.length > 0
          ? topScores.map((score, i) => \`<div>\${i + 1}. \${score}</div>\`).join('')
          : '<div>No scores yet!</div>';
          
      } catch (error) {
        leaderboardContent.innerHTML = '<div>Loading...</div>';
      }
    }
    
    function shareScore() {
      const message = \`I just scored \${gameState.score} points in Space Clicker! 🚀 Can you beat my score?\`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Space Clicker Score',
          text: message,
          url: window.location.origin
        });
      } else {
        // Fallback: try to copy to clipboard
        navigator.clipboard?.writeText(\`\${message} \${window.location.origin}\`)
          .then(() => alert('Score copied to clipboard!'))
          .catch(() => alert(message));
      }
    }
    
    // Event listeners
    clickZone.addEventListener('click', handleClick);
    clickZone.addEventListener('touchstart', handleClick);
    
    // Make functions global for button access
    window.startNewGame = startNewGame;
    window.shareScore = shareScore;
    
    // Load Mini App SDK and initialize
    async function initializeMiniApp() {
      try {
        // Import SDK - CRITICAL: This must be done correctly
        const { sdk } = await import('https://esm.sh/@farcaster/miniapp-sdk@0.1.6');
        
        console.log('Mini App SDK loaded successfully');
        
        // CRITICAL: Call ready() to hide splash screen
        await sdk.actions.ready();
        console.log('Mini App ready() called successfully');
        
        // Store SDK globally for other functions
        window.farcasterSdk = sdk;
        
      } catch (error) {
        console.warn('Mini App SDK not available (likely in web browser):', error);
        // Continue with web version
      }
    }
    
    // Initialize everything
    async function init() {
      createStars();
      await loadLeaderboard();
      await initializeMiniApp();
      startNewGame();
    }
    
    // Start the app
    init();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// API endpoints
app.post('/api/submit-score', (req, res) => {
  const { score } = req.body;
  
  if (typeof score === 'number' && score >= 0 && score <= 1000) {
    gameStats.totalClicks += score;
    gameStats.playerCount++;
    gameStats.recentScores.push(score);
    
    // Keep only recent scores
    if (gameStats.recentScores.length > 50) {
      gameStats.recentScores = gameStats.recentScores.slice(-50);
    }
    
    // Update high score
    if (score > gameStats.highScore) {
      gameStats.highScore = score;
    }
    
    res.json({ success: true, newHighScore: score === gameStats.highScore });
  } else {
    res.status(400).json({ error: 'Invalid score' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  res.json({
    highScore: gameStats.highScore,
    totalClicks: gameStats.totalClicks,
    playerCount: gameStats.playerCount,
    recentScores: gameStats.recentScores
  });
});

// Image endpoints
app.get('/api/image/preview', (req, res) => {
  const svg = `
<svg width="600" height="315" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  
  <rect width="600" height="315" fill="url(#bg)"/>
  
  <!-- Stars -->
  <circle cx="100" cy="50" r="2" fill="white" opacity="0.8"/>
  <circle cx="200" cy="80" r="1" fill="white" opacity="0.6"/>
  <circle cx="350" cy="60" r="2" fill="white" opacity="0.9"/>
  <circle cx="450" cy="90" r="1" fill="white" opacity="0.7"/>
  <circle cx="550" cy="40" r="2" fill="white" opacity="0.8"/>
  
  <!-- Main element -->
  <circle cx="300" cy="157" r="80" fill="#00ff88" opacity="0.2"/>
  <text x="300" y="180" text-anchor="middle" font-size="80" fill="white">🚀</text>
  
  <!-- Text -->
  <text x="300" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">Space Clicker</text>
  <text x="300" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.9">Click fast, score high! 🎯</text>
  <text x="300" y="295" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#00ff88">High Score: ${gameStats.highScore}</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(svg);
});

app.get('/api/image/splash', (req, res) => {
  const svg = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="splash" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </radialGradient>
  </defs>
  
  <rect width="400" height="400" fill="url(#splash)"/>
  <circle cx="200" cy="200" r="100" fill="#00ff88" opacity="0.1"/>
  <text x="200" y="230" text-anchor="middle" font-size="100">🚀</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Manifest endpoint (required for Mini Apps)
app.get('/well-known/farcaster.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  
  const manifest = {
    miniapp: {
      version: "1",
      name: "Space Clicker",
      iconUrl: `${baseUrl}/api/image/splash`,
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/api/image/preview`,
      buttonTitle: "🎮 Play Game",
      splashImageUrl: `${baseUrl}/api/image/splash`,
      splashBackgroundColor: "#1a1a2e",
      webhookUrl: null
    }
  };  
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(manifest);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: gameStats
  });
});

// Utility function
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  console.log(`Protocol:${protocol}://${req.get('host')}`);
  return `${protocol}://${req.get('host')}`;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mini App server running on port \${PORT}`);
  console.log(`📱 Frame URL: http://localhost:${PORT}`);
  console.log(`🎮 App URL: http://localhost:${PORT}/app`);
  console.log(`📋 Manifest: http://localhost:${PORT}/.well-known/farcaster.json`);
});

module.exports = app;