const { Pool } = require('pg');
const pool = new Pool({
	host: 'db',
	port: 5432,
	user: 'admin',
	password: 'local123',
	database: 'clothingStore'
});
module.exports = pool;