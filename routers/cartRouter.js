const express = require('express');
const authMiddleware = require('../auth/authMiddleware');
const cartController = require('../controllers/cartController');

const cartRouter = express.Router();

cartRouter.use((req, res, next) => authMiddleware.checkToken(req, res, next));

cartRouter.post('/:userId', cartController.createCart);

cartRouter.put('/:cartId', cartController.updateCart);

cartRouter.get('/:cartId', cartController.getCart);

cartRouter.delete('/:cartId', cartController.deleteCart);

cartRouter.delete('/:cartId/buy', cartController.buyCart);
  

module.exports = cartRouter;