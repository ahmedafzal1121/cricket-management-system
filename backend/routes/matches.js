const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all matches
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                m.*,
                t1.team_name as team1_name,
                t2.team_name as team2_name
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.team_id
            JOIN teams t2 ON m.team2_id = t2.team_id
            ORDER BY m.match_date DESC
        `);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single match
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                m.*,
                t1.team_name as team1_name,
                t2.team_name as team2_name
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.team_id
            JOIN teams t2 ON m.team2_id = t2.team_id
            WHERE m.match_id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create match
router.post('/', async (req, res) => {
    try {
        const {
            team1_id,
            team2_id,
            match_date,
            venue,
            match_type,
            status
        } = req.body;

        const result = await db.query(
            `INSERT INTO matches 
            (team1_id, team2_id, match_date, venue, match_type, status)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING match_id`,
            [team1_id, team2_id, match_date, venue, match_type, status]
        );

        res.status(201).json({
            match_id: result.rows[0].match_id,
            message: 'Match created successfully'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update match
router.put('/:id', async (req, res) => {
    try {
        const {
            team1_score,
            team2_score,
            status,
            match_winner_id
        } = req.body;

        await db.query(
            `UPDATE matches SET 
             team1_score=$1,
             team2_score=$2,
             status=$3,
             match_winner_id=$4
             WHERE match_id=$5`,
            [team1_score, team2_score, status, match_winner_id, req.params.id]
        );

        res.json({ message: 'Match updated successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete match
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM matches WHERE match_id=$1', [req.params.id]);
        res.json({ message: 'Match deleted successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;