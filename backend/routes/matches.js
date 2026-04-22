const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper function to check if team has players
async function checkTeamHasPlayers(teamId) {
    const [players] = await db.query(
        'SELECT COUNT(*) as count FROM players WHERE team_id = ?',
        [teamId]
    );
    return players[0].count > 0;
}

// Get all matches
router.get('/', async (req, res) => {
    try {
        const [matches] = await db.query(`
            SELECT 
                m.*,
                t1.team_name as team1_name,
                t2.team_name as team2_name,
                tw.team_name as toss_winner_name,
                mw.team_name as match_winner_name,
                p.player_name as man_of_match_name,
                DATE_FORMAT(m.match_date, '%Y-%m-%d') as match_date
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.team_id
            JOIN teams t2 ON m.team2_id = t2.team_id
            LEFT JOIN teams tw ON m.toss_winner_id = tw.team_id
            LEFT JOIN teams mw ON m.match_winner_id = mw.team_id
            LEFT JOIN players p ON m.man_of_match = p.player_id
            ORDER BY m.match_date DESC
        `);
        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single match
router.get('/:id', async (req, res) => {
    try {
        const [match] = await db.query(`
            SELECT 
                m.*,
                t1.team_name as team1_name,
                t2.team_name as team2_name,
                tw.team_name as toss_winner_name,
                mw.team_name as match_winner_name,
                p.player_name as man_of_match_name,
                DATE_FORMAT(m.match_date, '%Y-%m-%d') as match_date
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.team_id
            JOIN teams t2 ON m.team2_id = t2.team_id
            LEFT JOIN teams tw ON m.toss_winner_id = tw.team_id
            LEFT JOIN teams mw ON m.match_winner_id = mw.team_id
            LEFT JOIN players p ON m.man_of_match = p.player_id
            WHERE m.match_id = ?
        `, [req.params.id]);
        
        if (match.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        res.json(match[0]);
    } catch (error) {
        console.error('Error fetching match:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create match - WITH ALL FIELDS INCLUDING SCORES
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            team1_id, 
            team2_id, 
            match_date, 
            venue, 
            match_type, 
            status,
            team1_score,
            team2_score,
            toss_winner_id,
            match_winner_id,
            man_of_match
        } = req.body;
        
        console.log('Received match data:', req.body);
        
        // Validate teams are different
        if (team1_id === team2_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'Teams must be different' });
        }
        
        // Check if both teams have players
        const [team1Players] = await connection.query(
            'SELECT COUNT(*) as count FROM players WHERE team_id = ?',
            [team1_id]
        );
        
        const [team2Players] = await connection.query(
            'SELECT COUNT(*) as count FROM players WHERE team_id = ?',
            [team2_id]
        );
        
        const team1HasPlayers = team1Players[0].count > 0;
        const team2HasPlayers = team2Players[0].count > 0;
        
        if (!team1HasPlayers || !team2HasPlayers) {
            const [teams] = await connection.query(
                'SELECT team_id, team_name FROM teams WHERE team_id IN (?, ?)',
                [team1_id, team2_id]
            );
            
            const team1Name = teams.find(t => t.team_id == team1_id)?.team_name || 'Team 1';
            const team2Name = teams.find(t => t.team_id == team2_id)?.team_name || 'Team 2';
            
            let errorMsg = 'Cannot create match: ';
            if (!team1HasPlayers && !team2HasPlayers) {
                errorMsg += `Both "${team1Name}" and "${team2Name}" have no players.`;
            } else if (!team1HasPlayers) {
                errorMsg += `"${team1Name}" has no players.`;
            } else {
                errorMsg += `"${team2Name}" has no players.`;
            }
            errorMsg += ' Please add players to the team(s) first.';
            
            await connection.rollback();
            return res.status(400).json({ error: errorMsg });
        }
        
        // Insert match with ALL fields
        const [result] = await connection.query(
            `INSERT INTO matches (
                team1_id, 
                team2_id, 
                match_date, 
                venue, 
                match_type, 
                status,
                team1_score,
                team2_score,
                toss_winner_id,
                match_winner_id,
                man_of_match
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                team1_id, 
                team2_id, 
                match_date, 
                venue || null, 
                match_type || 'T20', 
                status || 'Scheduled',
                team1_score || null,
                team2_score || null,
                toss_winner_id || null,
                match_winner_id || null,
                man_of_match || null
            ]
        );
        
        console.log('Match created with ID:', result.insertId);
        console.log('Status:', status);
        console.log('Winner ID:', match_winner_id);
        console.log('Team1 Score:', team1_score);
        console.log('Team2 Score:', team2_score);
        
        // If match is completed with a winner, update team records
        if (status === 'Completed' && match_winner_id) {
            const winnerId = parseInt(match_winner_id);
            const loserId = (parseInt(team1_id) === winnerId) ? parseInt(team2_id) : parseInt(team1_id);
            
            // Update winner's wins
            await connection.query(
                'UPDATE teams SET wins = wins + 1 WHERE team_id = ?',
                [winnerId]
            );
            
            // Update loser's losses
            await connection.query(
                'UPDATE teams SET losses = losses + 1 WHERE team_id = ?',
                [loserId]
            );
            
            console.log(`Updated: Team ${winnerId} +1 win, Team ${loserId} +1 loss`);
        }
        
        await connection.commit();
        
        res.status(201).json({ 
            match_id: result.insertId, 
            message: 'Match created successfully',
            data: {
                match_id: result.insertId,
                status: status,
                winner_id: match_winner_id
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating match:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update match
router.put('/:id', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const matchId = parseInt(req.params.id);
        const { 
            team1_id, 
            team2_id, 
            team1_score, 
            team2_score, 
            toss_winner_id, 
            match_winner_id, 
            man_of_match, 
            status, 
            match_date, 
            venue, 
            match_type 
        } = req.body;
        
        console.log('Updating match:', matchId);
        console.log('New data:', req.body);
        
        // Get the old match data
        const [oldMatch] = await connection.query(
            'SELECT team1_id, team2_id, match_winner_id, status FROM matches WHERE match_id = ?',
            [matchId]
        );
        
        if (oldMatch.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Match not found' });
        }
        
        // If teams are being changed, validate they have players
        const newTeam1Id = team1_id || oldMatch[0].team1_id;
        const newTeam2Id = team2_id || oldMatch[0].team2_id;
        
        if (newTeam1Id !== oldMatch[0].team1_id || newTeam2Id !== oldMatch[0].team2_id) {
            const team1HasPlayers = await checkTeamHasPlayers(newTeam1Id);
            const team2HasPlayers = await checkTeamHasPlayers(newTeam2Id);
            
            if (!team1HasPlayers || !team2HasPlayers) {
                await connection.rollback();
                return res.status(400).json({ 
                    error: 'Cannot update match: One or both teams have no players' 
                });
            }
        }
        
        const old = oldMatch[0];
        const oldWinnerId = old.match_winner_id;
        const newWinnerId = match_winner_id ? parseInt(match_winner_id) : null;
        const oldStatus = old.status;
        const newStatus = status || oldStatus;
        
        // ROLLBACK OLD WIN/LOSS (if match was previously completed)
        if (oldStatus === 'Completed' && oldWinnerId) {
            const oldLoserId = (old.team1_id === oldWinnerId) ? old.team2_id : old.team1_id;
            
            await connection.query(
                'UPDATE teams SET wins = GREATEST(wins - 1, 0) WHERE team_id = ?',
                [oldWinnerId]
            );
            
            await connection.query(
                'UPDATE teams SET losses = GREATEST(losses - 1, 0) WHERE team_id = ?',
                [oldLoserId]
            );
            
            console.log(`Rolled back: Team ${oldWinnerId} -1 win, Team ${oldLoserId} -1 loss`);
        }
        
        // UPDATE THE MATCH
        await connection.query(
            `UPDATE matches 
             SET team1_score = ?, team2_score = ?, toss_winner_id = ?, 
                 match_winner_id = ?, man_of_match = ?, status = ?,
                 match_date = COALESCE(?, match_date),
                 venue = COALESCE(?, venue),
                 match_type = COALESCE(?, match_type)
             WHERE match_id = ?`,
            [team1_score, team2_score, toss_winner_id, newWinnerId, man_of_match, newStatus,
             match_date, venue, match_type, matchId]
        );
        
        // APPLY NEW WIN/LOSS (if match is now completed)
        if (newStatus === 'Completed' && newWinnerId) {
            const newLoserId = (newTeam1Id === newWinnerId) ? newTeam2Id : newTeam1Id;
            
            await connection.query(
                'UPDATE teams SET wins = wins + 1 WHERE team_id = ?',
                [newWinnerId]
            );
            
            await connection.query(
                'UPDATE teams SET losses = losses + 1 WHERE team_id = ?',
                [newLoserId]
            );
            
            console.log(`Applied: Team ${newWinnerId} +1 win, Team ${newLoserId} +1 loss`);
        }
        
        await connection.commit();
        res.json({ message: 'Match updated successfully' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error updating match:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Delete match
router.delete('/:id', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const [match] = await connection.query(
            'SELECT team1_id, team2_id, match_winner_id, status FROM matches WHERE match_id = ?',
            [req.params.id]
        );
        
        if (match.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Match not found' });
        }
        
        const m = match[0];
        
        // If match was completed, rollback the win/loss
        if (m.status === 'Completed' && m.match_winner_id) {
            const loserId = (m.team1_id === m.match_winner_id) ? m.team2_id : m.team1_id;
            
            await connection.query(
                'UPDATE teams SET wins = GREATEST(wins - 1, 0) WHERE team_id = ?',
                [m.match_winner_id]
            );
            
            await connection.query(
                'UPDATE teams SET losses = GREATEST(losses - 1, 0) WHERE team_id = ?',
                [loserId]
            );
            
            console.log(`Match deleted: Adjusted records for teams ${m.match_winner_id} and ${loserId}`);
        }
        
        await connection.query('DELETE FROM matches WHERE match_id = ?', [req.params.id]);
        
        await connection.commit();
        res.json({ message: 'Match deleted successfully' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting match:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;