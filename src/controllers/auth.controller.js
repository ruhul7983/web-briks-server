
const authService = require('../services/auth.service');

// LOGIN
async function login(req, res) {
  
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.apiError({ status: 400, message: 'email and password are required' });
    }

    const { token, user } = await authService.loginUser({ email, password });

    return res.apiResponse({ status: 200, data: { user, token } });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.apiError({ status: 401, message: 'Invalid email or password' });
    }
    return res.apiError({ status: 500, message: 'LOGIN_FAILED', error: err.message });
  }
};

// REQUEST PASSWORD RESET
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.apiError({ status: 400, message: 'Email is required' });
    }

    await authService.requestPasswordReset(email);

    return res.apiResponse({
      status: 200,
      message: 'Reset link sent successfully (demo only)',
    });
  } catch (err) {
    return res.apiError({ status: 500, message: 'RESET_FAILED', error: err.message });
  }
};

// CREATE USER (ADMIN ONLY)
async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.apiError({ status: 400, message: 'Missing fields (name, email, password, role)' });
    }

    const user = await authService.createUser({ name, email, password, role });

    return res.apiResponse({ status: 201, data: user });
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return res.apiError({ status: 409, message: 'User already exists' });
    }
    return res.apiError({ status: 500, message: 'USER_CREATE_FAILED', error: err.message });
  }
};

// ME
async function me(req, res) {
  try {
    const user = await authService.getUserById(req.user.uid);

    return res.apiResponse({ status: 200, data: user });
  } catch (err) {
    return res.apiError({ status: 500, message: 'FAILED_TO_FETCH_ME', error: err.message });
  }
};

// LOGOUT
async function logout(req, res) {
  return res.apiResponse({ status: 200, message: 'Logout successful' });
};

async function getUserList(req, res) {
  try {
    // Accept query params: ?page=1&limit=20&search=foo&role=ADMIN
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
    } = req.query || {};

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const result = await authService.getUserList({
      page: pageNum,
      limit: limitNum,
      search: search.trim(),
      role: role.trim() || null,
    });

    return res.apiResponse({
      status: 200,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    return res.apiError({
      status: 500,
      message: 'FAILED_FETCH_USERS',
      error: err.message,
    });
  }
}

// ===================== EDIT USER (ADMIN) =====================
async function editUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body || {};

    if (!id) {
      return res.apiError({ status: 400, message: "User ID is required" });
    }

    const updatedUser = await authService.editUser({
      id,
      name,
      email,
      password,
      role,
    });

    return res.apiResponse({
      status: 200,
      data: updatedUser,
    });

  } catch (err) {
    if (err.code === "EMAIL_EXISTS") {
      return res.apiError({ status: 409, message: "Email already in use" });
    }

    return res.apiError({
      status: 500,
      message: "USER_UPDATE_FAILED",
      error: err.message,
    });
  }
}
// ===================== DELETE USER (ADMIN) =====================
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.apiError({ status: 400, message: "User ID is required" });
    }

    await authService.deleteUser(id);

    return res.apiResponse({
      status: 200,
      message: "User deleted successfully",
    });

  } catch (err) {
    return res.apiError({
      status: 500,
      message: "USER_DELETE_FAILED",
      error: err.message,
    });
  }
}
async function singleUser(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.apiError({
        status: 400,
        message: "User ID is required",
      });
    }

    const user = await authService.getSingleUser(id);

    if (!user) {
      return res.apiError({
        status: 404,
        message: "User not found",
      });
    }

    return res.apiResponse({
      status: 200,
      data: user,
    });

  } catch (err) {
    return res.apiError({
      status: 500,
      message: "FETCH_SINGLE_USER_FAILED",
      error: err.message,
    });
  }
}
module.exports = {
  login,
  requestPasswordReset,
  createUser,
  me,
  logout,
  getUserList,
  editUser,
  deleteUser,
  singleUser,
};