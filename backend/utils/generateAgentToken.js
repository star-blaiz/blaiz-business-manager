const jwt = require("jsonwebtoken");

const generateAgentToken = (agent) => {
  return jwt.sign(
    {
      agentId: agent._id.toString(),
      accountType: "agent",
      role: "agent",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

module.exports = generateAgentToken;