const categoryService = require('../services/category.service');

module.exports = {
    // --- Category Controllers ---
    async createCategory(req, res) {
        try {
            // req.body should contain { name, slug, site }
            const category = await categoryService.createCategory(req.body);
            return res.apiResponse({ status: 201, data: category });
        } catch (err) {
            return res.apiError({ status: 500, message: "CATEGORY_CREATE_FAILED", error: err.message });
        }
    },

    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const updated = await categoryService.updateCategory(id, req.body);
            return res.apiResponse({ status: 200, data: updated });
        } catch (err) {
            return res.apiError({ status: 500, message: "CATEGORY_UPDATE_FAILED", error: err.message });
        }
    },

    async getAllCategories(req, res) {
        try {
            // Extract site from query params: /api/categories/all?site=ASHAD
            const { site } = req.query;
            
            // Pass it to service (Service now handles the default fallback)
            const categories = await categoryService.getAllCategories(site);

            return res.apiResponse({ status: 200, data: categories });
        } catch (err) {
            return res.apiError({ status: 500, message: "FETCH_FAILED", error: err.message });
        }
    },

    async deleteCategory(req, res) {
        try {
            await categoryService.deleteCategory(req.params.id);
            return res.apiResponse({ status: 200, message: "Category and linked subcategories deleted" });
        } catch (err) {
            return res.apiError({ status: 500, message: "DELETE_FAILED", error: err.message });
        }
    },

    // --- Subcategory Controllers ---
    async createSubcategory(req, res) {
        try {
            const subcat = await categoryService.createSubcategory(req.body);
            return res.apiResponse({ status: 201, data: subcat });
        } catch (err) {
            return res.apiError({ status: 500, message: "SUBCAT_CREATE_FAILED", error: err.message });
        }
    },

    async updateSubcategory(req, res) {
        try {
            const { id } = req.params;
            const updated = await categoryService.updateSubcategory(id, req.body);
            return res.apiResponse({ status: 200, data: updated });
        } catch (err) {
            return res.apiError({ status: 500, message: "SUBCAT_UPDATE_FAILED", error: err.message });
        }
    },

    async deleteSubcategory(req, res) {
        try {
            await categoryService.deleteSubcategory(req.params.id);
            return res.apiResponse({ status: 200, message: "Subcategory deleted" });
        } catch (err) {
            return res.apiError({ status: 500, message: "DELETE_FAILED", error: err.message });
        }
    }
};