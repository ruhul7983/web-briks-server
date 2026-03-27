const prisma = require('../utils/prisma');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// --------------------------------------------------
// Generate JWT
// --------------------------------------------------
function generateToken(user) {
  return jwt.sign(
    {
      uid: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// --------------------------------------------------
// LOGIN USER
// --------------------------------------------------
async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

// --------------------------------------------------
// REQUEST PASSWORD RESET (DEMO ONLY)
// --------------------------------------------------
async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Not throwing error intentionally to prevent user enumeration
  if (!user) return;

  console.log(`Password reset requested for: ${email} (demo only)`);

  return true;
}

// --------------------------------------------------
// CREATE USER (ADMIN)
// --------------------------------------------------
async function createUser({ name, email, password, role }) {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    const error = new Error("Email already exists");
    error.code = "EMAIL_EXISTS";
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return newUser;
}

// --------------------------------------------------
// GET USER BY ID
// --------------------------------------------------
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}
async function getUserList({ page = 1, limit = 20, search = '', role = null }) {
  const where = {};

  // role filter
  if (role) {
    where.role = role;
  }

  // search across name or email (case-insensitive)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;
  const take = limit;

  // total count
  const total = await prisma.user.count({ where });

  // fetch users (exclude password)
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

async function editUser({ id, name, email, password, role }) {
  // check if user exists
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error("USER_NOT_FOUND");

  // If email changed: check if already taken
  if (email && email !== existing.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      const err = new Error("Email already exists");
      err.code = "EMAIL_EXISTS";
      throw err;
    }
  }

  let hashedPassword = undefined;

  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      email: email ?? existing.email,
      role: role ?? existing.role,
      ...(hashedPassword ? { password: hashedPassword } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}


async function deleteUser(id) {
  await prisma.user.delete({
    where: { id },
  });
  return true;
}
async function getSingleUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

module.exports = {
  loginUser,
  requestPasswordReset,
  createUser,
  getUserById,
  getUserList,
  editUser,
  deleteUser,
  getSingleUser,
};
