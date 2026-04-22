const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all players
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, t.team_name 
            FROM players p 
            LEFT JOIN teams t ON p.team_id = t.team_id 
            ORDER BY p.player_name
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single player
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, t.team_name 
            FROM players p 
            LEFT JOIN teams t ON p.team_id = t.team_id 
            WHERE p.player_id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create player
router.post('/', async (req, res) => {
    try {
        const { team_id, player_name, role, batting_style, bowling_style, 
                jersey_number, date_of_birth, nationality } = req.body;

        const result = await db.query(
            `INSERT INTO players 
            (team_id, player_name, role, batting_style, bowling_style, jersey_number, date_of_birth, nationality)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING player_id`,
            [team_id, player_name, role, batting_style, bowling_style, jersey_number, date_of_birth, nationality]
        );

        res.status(201).json({
            player_id: result.rows[0].player_id,
            message: 'Player created successfully'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update player
router.put('/:id', async (req, res) => {
    try {
        const { team_id, player_name, role, batting_style, bowling_style, 
                jersey_number, date_of_birth, nationality } = req.body;

        await db.query(
            `UPDATE players SET 
            team_id=$1, player_name=$2, role=$3, batting_style=$4,
            bowling_style=$5, jersey_number=$6, date_of_birth=$7, nationality=$8
            WHERE player_id=$9`,
            [team_id, player_name, role, batting_style, bowling_style,
             jersey_number, date_of_birth, nationality, req.params.id]
        );

        res.json({ message: 'Player updated successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete player
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM players WHERE player_id=$1', [req.params.id]);
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;