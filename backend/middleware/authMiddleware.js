const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Agent = require("../models/agent");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* =========================================
   CHECK AGENT TOKEN
========================================= */

if (decoded.agentId) {

  const agent =
    await Agent.findById(
      decoded.agentId
    );

  if (!agent) {

    return res.status(401).json({
      success: false,
      message:
        "Agent account not found.",
    });

  }

  if (
    agent.applicationStatus !==
    "approved"
  ) {

    return res.status(403).json({
      success: false,
      message:
        "Your Agent application has not been approved.",
    });

  }

  if (
    agent.status !==
    "active"
  ) {

    return res.status(403).json({
      success: false,
      message:
        "This Agent account is currently inactive.",
    });

  }

  req.agent = agent;

  req.user = null;

  return next();

}

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is currently inactive.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login session.",
    });
  }
};

module.exports = protect;