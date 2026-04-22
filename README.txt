# 🏏 PSL Cricket Management System

A complete database management system for Pakistan Super League (PSL) cricket teams, players, and matches.

## 📋 Features
- Manage PSL Teams (Add, Edit, Delete)
- Manage Players (Add, Edit, Delete)
- Schedule and Record Matches
- View Statistics and Standings
- Automatic Win/Loss Tracking
- Player Performance Analytics

## 🛠️ Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **API:** RESTful API

## 📦 Installation Guide

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (v14 or higher)
2. Install [MySQL](https://www.mysql.com/) (or XAMPP)
3. Install [MySQL Workbench](https://www.mysql.com/products/workbench/) (optional)

### Step 1: Database Setup
1. Open MySQL Workbench or phpMyAdmin
2. Run the SQL file located at: `database/psl_database.sql`
3. This will create the database and insert sample data

### Step 2: Configure Database Connection
1. Navigate to `backend/database.js`
2. Update the MySQL credentials:
```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',           // Your MySQL username
    password: 'your_password', // Your MySQL password
    database: 'cricket_management',
    // ...
});