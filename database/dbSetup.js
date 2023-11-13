const fs = require('fs');
const pool = require('./db');

async function setup() {
	try {
		const sqlFilePath = 'database/create_tables.sql';
		const sql = fs.readFileSync(sqlFilePath, 'utf8');
		await pool.query(sql);
		console.log('Tables created successfully');
	} catch (error) {
		console.error('Error creating tables:', error);
	}
}

setup();