const prisma = require('../utils/prisma');
const { deleteFile } = require("../utils/file");

const safeParse = (data, fallback = []) => {
  try {
    if (!data || data === 'undefined') return fallback;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error("JSON Parse Error for field:", e.message);
    return fallback;
  }
};

// Helper to handle dates safely
const parseDate = (dateStr) => {
  if (!dateStr || dateStr === "") return new Date(); // Fallback to now
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d; // If invalid, use now
};

module.exports = {
async createProject(body, files = []) {
    try {
      const heroFile = files.find(f => f.fieldname === 'image');
      const imagePath = heroFile ? `/uploads/projects/${heroFile.filename}` : null;

      const rawDescription = safeParse(body.description, []);
      const processedDescription = rawDescription.map((block, index) => {
        const blockFile = files.find(f => f.fieldname === `blockImage_${index}`);
        return {
          tag: block.tag || "h2",
          subheading: block.subheading || "",
          content: block.content || "",
          blockImage: blockFile ? `/uploads/projects/${blockFile.filename}` : (block.blockImage || null)
        };
      });

      // Prepare data object separately for cleaner debugging
      const projectData = {
        site: body.site ? body.site.toUpperCase() : 'WEBBRIKS',
        title: body.title || "Untitled Project",
        slug: body.slug || `proj-${Date.now()}`,
        clientName: body.clientName || "N/A",
        impactAreas: safeParse(body.impactAreas, []),
        // Ensure valid date object
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        clientLocation: body.clientLocation || "N/A",
        featured: body.featured === 'true' || body.featured === true,
        status: body.status || "published",
        metaTitle: body.metaTitle || "",
        metaDescription: body.metaDescription || "",
        keywords: safeParse(body.keywords, []),
        image: imagePath,
        description: processedDescription 
      };

      return await prisma.project.create({ data: projectData });

    } catch (err) {
      // THIS WILL TELL YOU EXACTLY WHY IT FAILED IN YOUR TERMINAL
      if (err.code === 'P2002') {
        console.error("❌ PRISMA ERROR: A project with this slug already exists for this site.");
        throw new Error("A project with this slug already exists.");
      }
      
      console.error("❌ FULL PRISMA ERROR DETAILS:", err);
      throw err;
    }
  },

  async updateProject(id, body, files = []) {
    const old = await prisma.project.findUnique({ where: { id } });
    if (!old) throw new Error("Project not found");

    const heroFile = files.find(f => f.fieldname === 'image');
    let imagePath = old.image;
    if (heroFile) {
      if (old.image) deleteFile(old.image);
      imagePath = `/uploads/projects/${heroFile.filename}`;
    }

    const rawDescription = safeParse(body.description, []);
    const oldDescription = Array.isArray(old.description) ? old.description : [];

    const processedDescription = rawDescription.map((block, index) => {
      const blockFile = files.find(f => f.fieldname === `blockImage_${index}`);
      let finalBlockImage = block.blockImage;

      if (blockFile) {
        if (oldDescription[index]?.blockImage) deleteFile(oldDescription[index].blockImage);
        finalBlockImage = `/uploads/projects/${blockFile.filename}`;
      } else if (block.blockImage === null || block.blockImage === "null") {
        if (oldDescription[index]?.blockImage) deleteFile(oldDescription[index].blockImage);
        finalBlockImage = null;
      }

      return {
        tag: block.tag,
        subheading: block.subheading,
        content: block.content,
        blockImage: finalBlockImage
      };
    });

    return await prisma.project.update({
      where: { id },
      data: {
        site: body.site ? body.site.toUpperCase() : undefined,
        title: body.title,
        slug: body.slug,
        clientName: body.clientName,
        impactAreas: safeParse(body.impactAreas, []),
        // If updating and startDate is provided, parse it safely
        startDate: body.startDate !== undefined ? parseDate(body.startDate) : undefined,
        clientLocation: body.clientLocation,
        featured: body.featured === 'true' || body.featured === true,
        status: body.status,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: safeParse(body.keywords, []),
        image: imagePath,
        description: processedDescription
      }
    });
  },

  async fetchProjects(page, limit, site = 'WEBBRIKS') {
    const skip = (page - 1) * limit;
    const filterSite = site ? site.toUpperCase() : 'WEBBRIKS';

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where: { site: filterSite },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where: { site: filterSite } })
    ]);
    return { projects, total };
  },

  async getProjectBySlug(slug, site = 'WEBBRIKS') {
    const filterSite = site ? site.toUpperCase() : 'WEBBRIKS';
    return await prisma.project.findUnique({
      where: { 
        slug_site: { 
          slug: slug, 
          site: filterSite 
        } 
      }
    });
  },

  async getProjectById(id) {
    return await prisma.project.findUnique({ where: { id } });
  },

  async deleteProject(id) {
    return await prisma.project.delete({ where: { id } });
  }
};