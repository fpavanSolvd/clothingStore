const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('./routers/userRouter');
const productRouter = require('./routers/productRouter');
const cartRouter = require('./routers/cartRouter');
const categoryRouter = require('./routers/categoryRouter');

const port = 3000;
const app = express();
const router = express.Router();
app.use(bodyParser.json());

router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/carts', cartRouter);
router.use('/categories', categoryRouter);

app.use('/api/v1', router);

app.listen(port, async () => {
  console.log(`Server has started on port: ${port}`);
});
