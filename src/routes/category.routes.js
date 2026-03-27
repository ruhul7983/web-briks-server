const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const auth = require('../middlewares/auth');
const roleVerification = require('../middlewares/roleVerification');

// --- Public Routes ---
router.get('/all', categoryController.getAllCategories);

// --- Protected Routes (Admin & Moderator) ---
// Note: We allow MODERATOR to create/update, but only ADMIN can delete
const canManage = roleVerification(["ADMIN", "MODERATOR"]);
const isAdmin = roleVerification(["ADMIN"]);

// Categories
router.post('/create', auth, canManage, categoryController.createCategory);
router.patch('/update/:id', auth, canManage, categoryController.updateCategory); // FIXED: Added this
router.delete('/delete/:id', auth, isAdmin, categoryController.deleteCategory);

// Subcategories
router.post('/subcategory/create', auth, canManage, categoryController.createSubcategory);
router.patch('/subcategory/update/:id', auth, canManage, categoryController.updateSubcategory); // FIXED: Added this
router.delete('/subcategory/delete/:id', auth, isAdmin, categoryController.deleteSubcategory); // FIXED: Added this

module.exports = router;