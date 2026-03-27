const blogService = require("../services/blog.service");
const { deleteFile } = require("../utils/file");

function getBaseUrl(req) {
  if (process.env.SERVER_URL) return process.env.SERVER_URL.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function ensureAbsoluteUrl(base, val) {
  if (!val) return null;
  if (/^https?:\/\//i.test(val)) return val;
  return `${base}${val}`;
}

module.exports = {
  async createBlog(req, res) {
    try {
      // Pass the whole body (including site) to the service
      const blog = await blogService.createBlog(req.body, req.files || []);
      return res.apiResponse({ status: 201, data: blog });
    } catch (err) {
      console.error("Create Error:", err);
      return res.apiError({ status: 500, message: "Internal server error", error: err.message });
    }
  },

  async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const updated = await blogService.updateBlog(Number(id), req.body, req.files || []);
      return res.apiResponse({ status: 200, data: updated });
    } catch (err) {
      console.error("Update Error:", err);
      return res.apiError({ status: 500, message: "Failed to update article", error: err.message });
    }
  },

  async deleteBlog(req, res) {
    try {
      const { id } = req.params;
      const blog = await blogService.getBlogById(Number(id));
      if (!blog) return res.apiError({ status: 404, message: "Blog not found" });

      if (blog.image) deleteFile(blog.image);
      if (Array.isArray(blog.description)) {
        blog.description.forEach(block => {
          if (block.blockImage) deleteFile(block.blockImage);
        });
      }

      await blogService.deleteBlog(Number(id));
      return res.apiResponse({ status: 200, message: "Blog permanently removed" });
    } catch (err) {
      return res.apiError({ status: 500, message: "Deletion failed", error: err.message });
    }
  },

  async getAllBlogs(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, parseInt(req.query.limit) || 8);
      
      // 1. Capture the site from the query (?site=ASHAD)
      const { site } = req.query;

      // 2. Pass it to the service
      const { blogs, total } = await blogService.fetchBlogs(page, limit, site);

      const base = getBaseUrl(req);
      const data = blogs.map(blog => ({
        ...blog,
        image: ensureAbsoluteUrl(base, blog.image),
        description: Array.isArray(blog.description) ? blog.description.map(block => ({
            ...block,
            blockImage: ensureAbsoluteUrl(base, block.blockImage)
        })) : []
      }));

      return res.apiResponse({
        status: 200,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      return res.apiError({ status: 500, message: "Failed to fetch blogs", error: err.message });
    }
  },

  async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { site } = req.query; // Must pass site even for single slug fetch

      const blog = await blogService.getBlogBySlug(slug, site);
      if (!blog) return res.apiError({ status: 404, message: "Blog not found" });

      const base = getBaseUrl(req);
      blog.image = ensureAbsoluteUrl(base, blog.image);
      if (Array.isArray(blog.description)) {
          blog.description = blog.description.map(block => ({
              ...block,
              blockImage: ensureAbsoluteUrl(base, block.blockImage)
          }));
      }

      return res.apiResponse({ status: 200, data: blog });
    } catch (err) {
      return res.apiError({ status: 500, message: "Fetch failed", error: err.message });
    }
  }
};