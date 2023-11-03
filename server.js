const express = require('express');
const pool = require('./db');
const fs = require('fs');
const bodyParser = require('body-parser');
const userRouter = require('./routers/userRouter');
const productRouter = require('./routers/productRouter');

const port = 3000;

const app = express();

const router = express.Router();

app.use(bodyParser.json());

router.use('/users', userRouter);
router.use('/products', productRouter);

app.use('/api/v1', router);

app.get('/setup', async (req, res) => {
  try {
    const sqlFilePath = './sql/create_tables.sql';
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    await pool.query(sql);

    res.status(200).json({ message: 'Tables created successfully' });
  } catch (error) {
    console.error('Error creating tables:', error);
    res.status(500).json({ error: 'Error creating tables' });
  }
});

app.listen(port, () => console.log(`Server has started on port: ${port}`));
