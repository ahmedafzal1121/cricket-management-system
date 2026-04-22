const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all players
router.get('/', async (req, res) => {
    try {
        const [players] = await db.query(`
            SELECT p.*, t.team_name 
            FROM players p 
            LEFT JOIN teams t ON p.team_id = t.team_id 
            ORDER BY p.player_name
        `);
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single player
router.get('/:id', async (req, res) => {
    try {
        const [player] = await db.query(`
            SELECT p.*, t.team_name 
            FROM players p 
            LEFT JOIN teams t ON p.team_id = t.team_id 
            WHERE p.player_id = ?
        `, [req.params.id]);
        
        if (player.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json(player[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create player
router.post('/', async (req, res) => {
    try {
        const { team_id, player_name, role, batting_style, bowling_style, 
                jersey_number, date_of_birth, nationality } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO players (team_id, player_name, role, batting_style, bowling_style, 
             jersey_number, date_of_birth, nationality) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [team_id, player_name, role, batting_style, bowling_style, 
             jersey_number, date_of_birth, nationality]
        );
        
        res.status(201).json({ player_id: result.insertId, message: 'Player created successfully' });
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
            `UPDATE players SET team_id = ?, player_name = ?, role = ?, 
             batting_style = ?, bowling_style = ?, jersey_number = ?, 
             date_of_birth = ?, nationality = ? WHERE player_id = ?`,
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
        await db.query('DELETE FROM players WHERE player_id = ?', [req.params.id]);
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get players by team
router.get('/team/:teamId', async (req, res) => {
    try {
        const [players] = await db.query(
            'SELECT * FROM players WHERE team_id = ? ORDER BY player_name',
            [req.params.teamId]
        );
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;