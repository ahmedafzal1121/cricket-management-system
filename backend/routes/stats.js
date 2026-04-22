const express = require('express');
const router = express.Router();
const db = require('../database');

// Top scorers
router.get('/top-scorers', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.player_name, p.runs_scored, t.team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            ORDER BY p.runs_scored DESC
            LIMIT 10
        `);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top bowlers
router.get('/top-bowlers', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.player_name, p.wickets_taken, t.team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            ORDER BY p.wickets_taken DESC
            LIMIT 10
        `);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Team standings
router.get('/team-standings', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                team_name,
                wins,
                losses,
                (wins + losses) as matches_played
            FROM teams
            ORDER BY wins DESC
        `);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const teams = await db.query('SELECT COUNT(*) FROM teams');
        const players = await db.query('SELECT COUNT(*) FROM players');
        const matches = await db.query('SELECT COUNT(*) FROM matches');

        res.json({
            totalTeams: teams.rows[0].count,
            totalPlayers: players.rows[0].count,
            totalMatches: matches.rows[0].count
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;