const express = require('express');
const authMiddleware = require('../auth/authMiddleware');
const userController = require('../controllers/userController');

const userRouter = express.Router();

userRouter.use((req, res, next) => {
    const excludedRoutes = ['/login', '/register'];
  
    if (!excludedRoutes.includes(req.path)) {
        authMiddleware.checkToken(req, res, next);
    } else {
        next();
    }
});

userRouter.get('/', userController.getUsers);

userRouter.get('/:userId', userController.getUsers);

userRouter.put('/:userId', userController.updateUser);

userRouter.post('/register', userController.registerUser);

userRouter.post('/login', userController.login);

userRouter.delete('/:userId', userController.deleteUser);
  

module.exports = userRouter;