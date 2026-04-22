const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all teams
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.*,
                COUNT(p.player_id) as player_count
            FROM teams t
            LEFT JOIN players p ON t.team_id = p.team_id
            GROUP BY t.team_id
            ORDER BY t.team_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get single team
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.*,
                COUNT(p.player_id) as player_count
            FROM teams t
            LEFT JOIN players p ON t.team_id = p.team_id
            WHERE t.team_id = $1
            GROUP BY t.team_id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create team
router.post('/', async (req, res) => {
    try {
        const { team_name, coach_name, home_ground, founded_year } = req.body;

        const result = await db.query(
            `INSERT INTO teams (team_name, coach_name, home_ground, founded_year)
             VALUES ($1, $2, $3, $4)
             RETURNING team_id`,
            [team_name, coach_name, home_ground, founded_year]
        );

        res.status(201).json({
            team_id: result.rows[0].team_id,
            message: 'Team created successfully'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update team
router.put('/:id', async (req, res) => {
    try {
        const { team_name, coach_name, home_ground, founded_year } = req.body;

        await db.query(
            `UPDATE teams SET 
             team_name=$1, coach_name=$2, home_ground=$3, founded_year=$4
             WHERE team_id=$5`,
            [team_name, coach_name, home_ground, founded_year, req.params.id]
        );

        res.json({ message: 'Team updated successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete team
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM teams WHERE team_id=$1', [req.params.id]);
        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Team stats
router.get('/:id/stats', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                t.team_name,
                t.wins,
                t.losses,
                COUNT(p.player_id) as total_players
            FROM teams t
            LEFT JOIN players p ON t.team_id = p.team_id
            WHERE t.team_id = $1
            GROUP BY t.team_id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;