const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all teams
router.get('/', async (req, res) => {
    try {
        const [teams] = await db.query(`
            SELECT 
                t.*,
                COUNT(p.player_id) as player_count
            FROM teams t
            LEFT JOIN players p ON t.team_id = p.team_id
            GROUP BY t.team_id
            ORDER BY t.team_name
        `);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single team
router.get('/:id', async (req, res) => {
    try {
        const [team] = await db.query(`
            SELECT 
                t.*,
                COUNT(p.player_id) as player_count
            FROM teams t
            LEFT JOIN players p ON t.team_id = p.team_id
            WHERE t.team_id = ?
            GROUP BY t.team_id
        `, [req.params.id]);
        
        if (team.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(team[0]);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create team
router.post('/', async (req, res) => {
    try {
        const { team_name, coach_name, home_ground, founded_year } = req.body;
        
        // Check if team name already exists
        const [existing] = await db.query(
            'SELECT team_id FROM teams WHERE team_name = ?',
            [team_name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Team name already exists' });
        }
        
        const [result] = await db.query(
            'INSERT INTO teams (team_name, coach_name, home_ground, founded_year) VALUES (?, ?, ?, ?)',
            [team_name, coach_name, home_ground, founded_year]
        );
        
        res.status(201).json({ 
            team_id: result.insertId, 
            message: 'Team created successfully' 
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update team
router.put('/:id', async (req, res) => {
    try {
        const { team_name, coach_name, home_ground, founded_year } = req.body;
        
        // Check if new team name conflicts with another team
        const [existing] = await db.query(
            'SELECT team_id FROM teams WHERE team_name = ? AND team_id != ?',
            [team_name, req.params.id]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Team name already exists' });
        }
        
        await db.query(
            'UPDATE teams SET team_name = ?, coach_name = ?, home_ground = ?, founded_year = ? WHERE team_id = ?',
            [team_name, coach_name, home_ground, founded_year, req.params.id]
        );
        
        res.json({ message: 'Team updated successfully' });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete team - WITH CASCADE DELETE OF PLAYERS
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const teamId = parseInt(req.params.id);
        
        // Check if team exists
        const [team] = await connection.query(
            'SELECT team_name FROM teams WHERE team_id = ?',
            [teamId]
        );
        
        if (team.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Team not found' });
        }
        
        // Get counts for logging
        const [playerCount] = await connection.query(
            'SELECT COUNT(*) as count FROM players WHERE team_id = ?',
            [teamId]
        );
        
        // Get all completed matches where this team won
        const [wonMatches] = await connection.query(`
            SELECT 
                CASE 
                    WHEN team1_id = ? THEN team2_id 
                    ELSE team1_id 
                END AS opponent_id
            FROM matches 
            WHERE match_winner_id = ? AND status = 'Completed'
        `, [teamId, teamId]);
        
        // Get all completed matches where this team lost
        const [lostMatches] = await connection.query(`
            SELECT match_winner_id AS opponent_id
            FROM matches 
            WHERE (team1_id = ? OR team2_id = ?) 
            AND match_winner_id != ? 
            AND match_winner_id IS NOT NULL
            AND status = 'Completed'
        `, [teamId, teamId, teamId]);
        
        console.log(`Deleting team: ${team[0].team_name}`);
        console.log(`- Players to delete: ${playerCount[0].count}`);
        console.log(`- Matches won: ${wonMatches.length}`);
        console.log(`- Matches lost: ${lostMatches.length}`);
        
        // Adjust wins for teams that lost to this team (decrease their losses)
        for (const match of wonMatches) {
            await connection.query(
                'UPDATE teams SET losses = GREATEST(losses - 1, 0) WHERE team_id = ?',
                [match.opponent_id]
            );
        }
        
        // Adjust losses for teams that beat this team (decrease their wins)
        for (const match of lostMatches) {
            await connection.query(
                'UPDATE teams SET wins = GREATEST(wins - 1, 0) WHERE team_id = ?',
                [match.opponent_id]
            );
        }
        
        // Delete matches involving this team
        const [matchDelete] = await connection.query(
            'DELETE FROM matches WHERE team1_id = ? OR team2_id = ? OR toss_winner_id = ? OR match_winner_id = ?',
            [teamId, teamId, teamId, teamId]
        );
        console.log(`  - Deleted ${matchDelete.affectedRows} matches`);
        
        // Delete players (will CASCADE automatically due to foreign key, but we do it explicitly for count)
        const [playerDelete] = await connection.query(
            'DELETE FROM players WHERE team_id = ?',
            [teamId]
        );
        console.log(`  - Deleted ${playerDelete.affectedRows} players`);
        
        // Delete the team
        const [deleteResult] = await connection.query(
            'DELETE FROM teams WHERE team_id = ?',
            [teamId]
        );
        
        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Team not found' });
        }
        
        // Commit the transaction
        await connection.commit();
        
        res.json({ 
            message: 'Team and all associated data deleted successfully',
            details: {
                team_name: team[0].team_name,
                players_deleted: playerDelete.affectedRows,
                matches_deleted: matchDelete.affectedRows,
                opponent_records_updated: wonMatches.length + lostMatches.length
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting team:', error);
        res.status(500).json({ 
            error: 'Failed to delete team',
            message: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get team statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                t.team_name,
                t.coach_name,
                t.home_ground,
                COUNT(DISTINCT p.player_id) as total_players,
                COALESCE(SUM(p.runs_scored), 0) as total_runs,
                COALESCE(SUM(p.wickets_taken), 0) as total_wickets,
                t.wins,
                t.losses,
                (t.wins + t.losses) as matches_played
            FROM teams t
            LEFT JOIN players p ON t.team_id = p.team_id
            WHERE t.team_id = ?
            GROUP BY t.team_id
        `, [req.params.id]);
        
        if (stats.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching team stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get team players
router.get('/:id/players', async (req, res) => {
    try {
        const [players] = await db.query(`
            SELECT * FROM players 
            WHERE team_id = ?
            ORDER BY player_name
        `, [req.params.id]);
        
        res.json(players);
    } catch (error) {
        console.error('Error fetching team players:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;