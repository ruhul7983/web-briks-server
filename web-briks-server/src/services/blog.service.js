const prisma = require('../utils/prisma');
const { deleteFile } = require("../utils/file");

const safeParse = (data, fallback = []) => {
  try {
    if (!data) return fallback;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return fallback;
  }
};

module.exports = {
  async createBlog(body, files = []) {
    if (!body) throw new Error("Request body is missing.");

    const heroFile = files.find(f => f.fieldname === 'image');
    const imagePath = heroFile ? `/uploads/blogs/${heroFile.filename}` : null;

    const rawDescription = safeParse(body.description, []);
    const processedDescription = rawDescription.map((block, index) => {
      const blockFile = files.find(f => f.fieldname === `blockImage_${index}`);
      return {
        tag: block.tag || "h2",
        subheading: block.subheading || "",
        content: block.content || "",
        blockImage: blockFile ? `/uploads/blogs/${blockFile.filename}` : null
      };
    });

    return await prisma.blog.create({
      data: {
        site: body.site ? body.site.toUpperCase() : 'WEBBRIKS', // Multi-site support
        title: body.title || "Untitled",
        slug: body.slug || `post-${Date.now()}`,
        author: body.author || "Admin",
        readTime: String(body.readTime || ""),
        badge: body.badge || "",
        featured: body.featured === 'true' || body.featured === true,
        status: body.status || "published",
        metaTitle: body.metaTitle || "",
        metaDescription: body.metaDescription || "",
        keywords: safeParse(body.keywords, []),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        subcategoryId: body.subcategoryId ? Number(body.subcategoryId) : null,
        image: imagePath,
        description: processedDescription 
      }
    });
  },

  async updateBlog(id, body, files = []) {
    const oldBlog = await prisma.blog.findUnique({ where: { id } });
    if (!oldBlog) throw new Error("Blog not found");

    const heroFile = files.find(f => f.fieldname === 'image');
    let imagePath = oldBlog.image;
    if (heroFile) {
      if (oldBlog.image) deleteFile(oldBlog.image);
      imagePath = `/uploads/blogs/${heroFile.filename}`;
    }

    const rawDescription = safeParse(body.description, []);
    const oldDescription = Array.isArray(oldBlog.description) ? oldBlog.description : [];

    const processedDescription = rawDescription.map((block, index) => {
      const blockFile = files.find(f => f.fieldname === `blockImage_${index}`);
      let finalBlockImage = block.blockImage;

      if (blockFile) {
        if (oldDescription[index]?.blockImage) deleteFile(oldDescription[index].blockImage);
        finalBlockImage = `/uploads/blogs/${blockFile.filename}`;
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

    return await prisma.blog.update({
      where: { id },
      data: {
        site: body.site ? body.site.toUpperCase() : undefined, // Allow site updates
        title: body.title,
        slug: body.slug,
        author: body.author,
        readTime: String(body.readTime),
        badge: body.badge,
        featured: body.featured === 'true' || body.featured === true,
        status: body.status,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: safeParse(body.keywords, []),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        subcategoryId: body.subcategoryId ? Number(body.subcategoryId) : null,
        image: imagePath,
        description: processedDescription
      }
    });
  },

  async fetchBlogs(page, limit, site = 'WEBBRIKS') {
    const skip = (page - 1) * limit;
    const filterSite = site ? site.toUpperCase() : 'WEBBRIKS';

    const [blogs, total] = await prisma.$transaction([
      prisma.blog.findMany({
        where: { site: filterSite }, // Strict site filtering
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true, subcategory: true }
      }),
      prisma.blog.count({ where: { site: filterSite } }) // Count must also be filtered
    ]);
    return { blogs, total };
  },

  async getBlogBySlug(slug, site = 'WEBBRIKS') {
    const filterSite = site ? site.toUpperCase() : 'WEBBRIKS';
    
    // Uses the compound unique constraint @@unique([slug, site])
    return await prisma.blog.findUnique({
      where: {
        slug_site: {
          slug: slug,
          site: filterSite
        }
      },
      include: { category: true, subcategory: true }
    });
  },

  async getBlogById(id) {
    return await prisma.blog.findUnique({ where: { id } });
  },

  async deleteBlog(id) {
    return await prisma.blog.delete({ where: { id } });
  }
};