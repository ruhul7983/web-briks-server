const { verifyToken } = require("../utils/jwt");

function roleVerification(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded.role || !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          message: `Forbidden: Requires role: ${allowedRoles.join(", ")}`,
        });
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

module.exports = roleVerification;
