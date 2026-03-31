const projectService = require("../services/project.service");
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
  async createProject(req, res) {
    console.log(req.body);
    console.log(req.files);

    try {
      const project = await projectService.createProject(req.body, req.files || []);
      return res.apiResponse({ status: 201, data: project });
    } catch (err) {
      return res.apiError({ status: 500, message: "Failed to create project", error: err.message });
    }
  },

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updated = await projectService.updateProject(Number(id), req.body, req.files || []);
      return res.apiResponse({ status: 200, data: updated });
    } catch (err) {
      return res.apiError({ status: 500, message: "Failed to update project", error: err.message });
    }
  },

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(Number(id));
      if (!project) return res.apiError({ status: 404, message: "Project not found" });

      if (project.image) deleteFile(project.image);
      if (Array.isArray(project.description)) {
        project.description.forEach(block => {
          if (block.blockImage) deleteFile(block.blockImage);
        });
      }

      await projectService.deleteProject(Number(id));
      return res.apiResponse({ status: 200, message: "Project permanently removed" });
    } catch (err) {
      return res.apiError({ status: 500, message: "Deletion failed", error: err.message });
    }
  },

  async getAllProjects(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, parseInt(req.query.limit) || 8);
      const { site } = req.query;

      const { projects, total } = await projectService.fetchProjects(page, limit, site);

      const base = getBaseUrl(req);
      const data = projects.map(proj => ({
        ...proj,
        image: ensureAbsoluteUrl(base, proj.image),
        description: Array.isArray(proj.description) ? proj.description.map(block => ({
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
      return res.apiError({ status: 500, message: "Failed to fetch projects", error: err.message });
    }
  },

  async getProjectBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { site } = req.query;

      const project = await projectService.getProjectBySlug(slug, site);
      if (!project) return res.apiError({ status: 404, message: "Project not found" });

      const base = getBaseUrl(req);
      project.image = ensureAbsoluteUrl(base, project.image);
      if (Array.isArray(project.description)) {
        project.description = project.description.map(block => ({
            ...block,
            blockImage: ensureAbsoluteUrl(base, block.blockImage)
        }));
      }

      return res.apiResponse({ status: 200, data: project });
    } catch (err) {
      return res.apiError({ status: 500, message: "Fetch failed", error: err.message });
    }
  }
};