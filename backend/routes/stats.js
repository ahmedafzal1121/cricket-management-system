const express = require('express');
const router = express.Router();
const db = require('../database');

// Get top run scorers
router.get('/top-scorers', async (req, res) => {
    try {
        const [scorers] = await db.query(`
            SELECT p.player_name, p.role, t.team_name, p.runs_scored, p.matches_played,
                   ROUND(p.runs_scored / NULLIF(p.matches_played, 0), 2) as average
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            ORDER BY p.runs_scored DESC
            LIMIT 10
        `);
        res.json(scorers || []);
    } catch (error) {
        console.error('Error in top-scorers:', error);
        res.status(500).json({ error: error.message, data: [] });
    }
});

// Get top wicket takers
router.get('/top-bowlers', async (req, res) => {
    try {
        const [bowlers] = await db.query(`
            SELECT p.player_name, p.role, t.team_name, p.wickets_taken, p.matches_played
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            WHERE p.wickets_taken > 0
            ORDER BY p.wickets_taken DESC
            LIMIT 10
        `);
        res.json(bowlers || []);
    } catch (error) {
        console.error('Error in top-bowlers:', error);
        res.status(500).json({ error: error.message, data: [] });
    }
});

// Get team standings - FIXED VERSION
router.get('/team-standings', async (req, res) => {
    try {
        const [standings] = await db.query(`
            SELECT 
                t.team_id,
                t.team_name, 
                t.wins, 
                t.losses,
                t.wins + t.losses as matches_played,
                ROUND((t.wins / NULLIF(t.wins + t.losses, 0)) * 100, 2) as win_percentage
            FROM teams t
            ORDER BY t.wins DESC, win_percentage DESC
        `);
        res.json(standings || []);
    } catch (error) {
        console.error('Error in team-standings:', error);
        res.status(500).json({ error: error.message, data: [] });
    }
});

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const [totalTeams] = await db.query('SELECT COUNT(*) as count FROM teams');
        const [totalPlayers] = await db.query('SELECT COUNT(*) as count FROM players');
        const [totalMatches] = await db.query('SELECT COUNT(*) as count FROM matches');
        const [completedMatches] = await db.query("SELECT COUNT(*) as count FROM matches WHERE status = 'Completed'");
        
        res.json({
            totalTeams: totalTeams[0]?.count || 0,
            totalPlayers: totalPlayers[0]?.count || 0,
            totalMatches: totalMatches[0]?.count || 0,
            completedMatches: completedMatches[0]?.count || 0
        });
    } catch (error) {
        console.error('Error in dashboard:', error);
        res.status(500).json({ 
            error: error.message,
            totalTeams: 0,
            totalPlayers: 0,
            totalMatches: 0,
            completedMatches: 0
        });
    }
});

module.exports = router;