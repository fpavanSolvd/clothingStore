const express = require('express');
const authMiddleware = require('../auth/authMiddleware'); 
const categoryController = require('../controllers/categoryController');

const categoryRouter = express.Router();
categoryRouter.use((req, res, next) => authMiddleware.checkToken(req, res, next));

categoryRouter.get('/', categoryController.getCategories);

categoryRouter.get('/:categoryId', categoryController.getCategory);

categoryRouter.post('/', categoryController.create);

categoryRouter.delete('/:categoryId', categoryController.delete);


module.exports = categoryRouter;