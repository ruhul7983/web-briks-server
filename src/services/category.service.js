const prisma = require('../utils/prisma');

module.exports = {
    // --- Category Logic ---
    async createCategory(data) {
        return await prisma.category.create({
            data: { 
                name: data.name, 
                slug: data.slug,
                // Ensure site is saved correctly, default to WEBBRIKS if missing
                site: data.site ? data.site.toUpperCase() : 'WEBBRIKS' 
            }
        });
    },

    async updateCategory(id, data) {
        return await prisma.category.update({
            where: { id: Number(id) },
            data: { 
                name: data.name, 
                slug: data.slug,
                // Allow updating the site if necessary
                site: data.site ? data.site.toUpperCase() : undefined 
            }
        });
    },

    async getAllCategories(site = null) {
        // IMPORTANT: If site is null/undefined, we default to WEBBRIKS.
        // This prevents the empty {} where clause that returns ALL data.
        const filterSite = site ? site.toUpperCase() : 'WEBBRIKS';
        
        return await prisma.category.findMany({
            where: {
                site: filterSite
            },
            include: { 
                subcategories: {
                    // Only fetch subcategories belonging to this site
                    where: { site: filterSite },
                    orderBy: { name: 'asc' }
                } 
            },
            orderBy: { name: 'asc' }
        });
    },

    async deleteCategory(id) {
        return await prisma.category.delete({ where: { id: Number(id) } });
    },

    // --- Subcategory Logic ---
    async createSubcategory(data) {
        return await prisma.subcategory.create({
            data: {
                name: data.name,
                slug: data.slug,
                categoryId: Number(data.categoryId),
                site: data.site ? data.site.toUpperCase() : 'WEBBRIKS'
            }
        });
    },

    async updateSubcategory(id, data) {
        return await prisma.subcategory.update({
            where: { id: Number(id) },
            data: { 
                name: data.name, 
                slug: data.slug,
                site: data.site ? data.site.toUpperCase() : undefined
            }
        });
    },

    async deleteSubcategory(id) {
        return await prisma.subcategory.delete({ where: { id: Number(id) } });
    }
};