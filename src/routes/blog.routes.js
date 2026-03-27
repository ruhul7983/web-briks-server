const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const auth = require('../middlewares/auth');
const roleVerification = require('../middlewares/roleVerification');
const multer = require('multer');
const path = require('path');

// Multer Setup
const storage = multer.diskStorage({
  destination: 'public/uploads/blogs/',
  filename: (req, file, cb) => {
    cb(null, `blog-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });
// --- Public Routes ---
router.get('/all', blogController.getAllBlogs); // Paginated list
router.get('/single/:slug', blogController.getBlogBySlug);

// --- Private Routes (Admin Only) ---
router.post('/create', auth, roleVerification(["ADMIN", "MODERATOR"]), upload.any(), blogController.createBlog);
router.patch('/update/:id', auth, roleVerification(["ADMIN", "MODERATOR"]), upload.any(), blogController.updateBlog);
router.delete('/delete/:id', auth, roleVerification(["ADMIN"]), blogController.deleteBlog);

module.exports = router;