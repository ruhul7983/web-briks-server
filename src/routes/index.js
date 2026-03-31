// src/routes/index.js
const { Router } = require('express');

const router = Router();

const authRoutes = require('../routes/auth.routes');
const blogRoutes = require('../routes/blog.routes');
const categoriesRoutes = require('../routes/category.routes');
const projectsRoutes = require('../routes/project.routes');





// middlewares
const auth = require('../middlewares/auth');


// user routes
router.use('/auth',  authRoutes);
router.use('/blogs',  blogRoutes);
router.use('/categories',  categoriesRoutes);
router.use('/projects',  projectsRoutes);



module.exports = router;
