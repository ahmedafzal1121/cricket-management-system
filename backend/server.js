const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // ← Changed this line

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// API Routes
const playersRoutes = require('./routes/players');
const teamsRoutes = require('./routes/teams');
const matchesRoutes = require('./routes/matches');
const statsRoutes = require('./routes/stats');

app.use('/api/players', playersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/stats', statsRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve other HTML pages
app.get('/teams.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/teams.html'));
});

app.get('/players.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/players.html'));
});

app.get('/matches.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/matches.html'));
});

app.get('/stats.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/stats.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => { // ← Changed this line
    console.log(`🏏 Cricket Management System running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`👥 Teams: http://localhost:${PORT}/teams.html`);
    console.log(`🏃 Players: http://localhost:${PORT}/players.html`);
});