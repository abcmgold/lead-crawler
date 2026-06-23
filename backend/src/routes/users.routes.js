const express = require('express');
const usersController = require('../controllers/users.controller');
const authorize = require('../middlewares/authorize.middleware');

const router = express.Router();

// Only ADMIN role can access these routes
router.get('/', authorize('ADMIN', 'admin'), usersController.getUsers);
router.post('/', authorize('ADMIN', 'admin'), usersController.createUser);
router.put('/:id', authorize('ADMIN', 'admin'), usersController.updateUser);
router.delete('/:id', authorize('ADMIN', 'admin'), usersController.deleteUser);

module.exports = router;
