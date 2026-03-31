const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleVerification = require('../middlewares/roleVerification');
const multer = require('multer');
const path = require('path');
const projectController = require('../controllers/project.controller');

// Multer Setup for Projects
const storage = multer.diskStorage({
  destination: 'public/uploads/projects/',
  filename: (req, file, cb) => {
    cb(null, `project-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// --- Public Routes ---
router.get('/all', projectController.getAllProjects);
router.get('/single/:slug', projectController.getProjectBySlug);

// --- Private Routes ---
router.post('/create', auth, roleVerification(["ADMIN", "MODERATOR"]), upload.any(), projectController.createProject);
router.patch('/update/:id', auth, roleVerification(["ADMIN", "MODERATOR"]), upload.any(), projectController.updateProject);
router.delete('/delete/:id', auth, roleVerification(["ADMIN"]), projectController.deleteProject);

module.exports = router;