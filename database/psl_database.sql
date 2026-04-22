-- =============================================
-- PSL Cricket Management System Database
-- =============================================

DROP DATABASE IF EXISTS cricket_management;
CREATE DATABASE cricket_management;
USE cricket_management;

-- Teams Table
CREATE TABLE teams (
    team_id INT PRIMARY KEY AUTO_INCREMENT,
    team_name VARCHAR(100) NOT NULL UNIQUE,
    coach_name VARCHAR(100),
    home_ground VARCHAR(100),
    founded_year INT,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players Table
CREATE TABLE players (
    player_id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT,
    player_name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    batting_style VARCHAR(50),
    bowling_style VARCHAR(50),
    jersey_number INT,
    date_of_birth DATE,
    nationality VARCHAR(50),
    matches_played INT DEFAULT 0,
    runs_scored INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Matches Table
CREATE TABLE matches (
    match_id INT PRIMARY KEY AUTO_INCREMENT,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    match_date DATE NOT NULL,
    venue VARCHAR(100),
    match_type VARCHAR(50),
    toss_winner_id INT,
    match_winner_id INT,
    team1_score VARCHAR(50),
    team2_score VARCHAR(50),
    man_of_match INT,
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team1_id) REFERENCES teams(team_id),
    FOREIGN KEY (team2_id) REFERENCES teams(team_id),
    FOREIGN KEY (toss_winner_id) REFERENCES teams(team_id),
    FOREIGN KEY (match_winner_id) REFERENCES teams(team_id),
    FOREIGN KEY (man_of_match) REFERENCES players(player_id)
);

-- Match Performances Table
CREATE TABLE match_performances (
    performance_id INT PRIMARY KEY AUTO_INCREMENT,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    runs_scored INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    overs_bowled DECIMAL(4,1) DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    catches INT DEFAULT 0,
    stumpings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

-- Insert Sample PSL Data
INSERT INTO teams (team_name, coach_name, home_ground, founded_year) VALUES
('Karachi Kings', 'Wasim Akram', 'National Stadium Karachi', 2015),
('Lahore Qalandars', 'Aaqib Javed', 'Gaddafi Stadium', 2015),
('Islamabad United', 'Johan Botha', 'Rawalpindi Cricket Stadium', 2015),
('Peshawar Zalmi', 'Darren Sammy', 'Arbab Niaz Stadium', 2015),
('Quetta Gladiators', 'Moin Khan', 'Bugti Stadium', 2015),
('Multan Sultans', 'Andy Flower', 'Multan Cricket Stadium', 2018);

-- Insert Players (abbreviated for space - include all players from previous code)
INSERT INTO players (team_id, player_name, role, batting_style, bowling_style, jersey_number, nationality, matches_played, runs_scored, wickets_taken) VALUES
(1, 'Babar Azam', 'Batsman', 'Right-hand', 'N/A', 56, 'Pakistan', 45, 1850, 0),
(1, 'Imad Wasim', 'All-rounder', 'Left-hand', 'Spin', 10, 'Pakistan', 52, 780, 45),
(2, 'Shaheen Shah Afridi', 'Bowler', 'Left-hand', 'Fast', 10, 'Pakistan', 42, 180, 72),
(2, 'Fakhar Zaman', 'Batsman', 'Left-hand', 'N/A', 7, 'Pakistan', 50, 2100, 0),
(3, 'Shadab Khan', 'All-rounder', 'Right-hand', 'Spin', 20, 'Pakistan', 48, 685, 52),
(3, 'Asif Ali', 'Batsman', 'Right-hand', 'N/A', 33, 'Pakistan', 44, 920, 0),
(4, 'Babar Azam', 'Batsman', 'Right-hand', 'N/A', 56, 'Pakistan', 38, 1425, 0),
(4, 'Wahab Riaz', 'Bowler', 'Left-hand', 'Fast', 25, 'Pakistan', 52, 145, 68),
(5, 'Sarfaraz Ahmed', 'Wicket-keeper', 'Right-hand', 'N/A', 42, 'Pakistan', 55, 1240, 0),
(5, 'Mohammad Nawaz', 'All-rounder', 'Left-hand', 'Spin', 21, 'Pakistan', 48, 625, 42),
(6, 'Mohammad Rizwan', 'Wicket-keeper', 'Right-hand', 'N/A', 1, 'Pakistan', 52, 2150, 0),
(6, 'Shahid Afridi', 'All-rounder', 'Right-hand', 'Spin', 10, 'Pakistan', 45, 950, 48);

-- Insert Sample Matches
INSERT INTO matches (team1_id, team2_id, match_date, venue, match_type, toss_winner_id, match_winner_id, team1_score, team2_score, status) VALUES
(1, 2, '2024-02-15', 'National Stadium Karachi', 'T20', 1, 2, '165/7', '168/5', 'Completed'),
(3, 4, '2024-02-16', 'Rawalpindi Cricket Stadium', 'T20', 4, 3, '180/6', '175/8', 'Completed'),
(5, 6, '2024-02-17', 'Bugti Stadium', 'T20', 5, 6, '155/9', '159/4', 'Completed');

-- Update team records
UPDATE teams SET wins = 1, losses = 1 WHERE team_id = 1;
UPDATE teams SET wins = 1, losses = 0 WHERE team_id = 2;
UPDATE teams SET wins = 1, losses = 0 WHERE team_id = 3;
UPDATE teams SET wins = 0, losses = 1 WHERE team_id = 4;
UPDATE teams SET wins = 0, losses = 1 WHERE team_id = 5;
UPDATE teams SET wins = 1, losses = 0 WHERE team_id = 6;