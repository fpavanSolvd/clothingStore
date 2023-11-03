const express = require('express');
const pool = require('./db');
const fs = require('fs');
const bodyParser = require('body-parser');
const userRouter = require('./routers/userRouter');
const productRouter = require('./routers/productRouter');
const cartRouter = require('./routers/cartRouter');

const port = 3000;
const app = express();
const router = express.Router();
app.use(bodyParser.json());

router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/carts', cartRouter);

app.use('/api/v1', router);

app.listen(port, async () => {
  console.log(`Server has started on port: ${port}`);
  try {
    const sqlFilePath = './sql/create_tables.sql';
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    await pool.query(sql);
    console.log('Tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error);
  }
});
