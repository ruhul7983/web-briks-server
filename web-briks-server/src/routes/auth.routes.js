// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const auth = require('../middlewares/auth'); // decodes JWT -> req.user
const roleVerification = require('../middlewares/roleVerification');

// PUBLIC
router.post('/login', controller.login);


router.post('/password/forgot', controller.requestPasswordReset);    

//private
router.post('/createUser', auth, roleVerification(["ADMIN"]), controller.createUser);
router.get('/user-list', roleVerification(["ADMIN"]),auth, controller.getUserList);
router.put('/edit-user/:id', auth, roleVerification(["ADMIN"]), controller.editUser);
router.delete('/delete-user/:id', auth, roleVerification(["ADMIN"]), controller.deleteUser);
router.get('/user/:id', auth, roleVerification(["ADMIN"]), controller.singleUser);


router.get('/me', auth, controller.me);
router.post('/logout', auth, controller.logout);

module.exports = router;
