const Agent = require("../models/agent");
const jwt = require("jsonwebtoken");

/* ==================================================
   GET AGENT SESSION STATUS
================================================== */

async function getAgentSessionStatus(req, res) {
    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });
        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (!decoded.agentId) {
            return res.status(401).json({
                success: false,
                message:
                    "Agent authentication required."
            });
        }

        const agent =
            await Agent.findById(
                decoded.agentId
            ).select(
                "_id fullName email applicationStatus status rejectionReason"
            );

        if (!agent) {
            return res.status(404).json({
                success: false,
                message:
                    "Agent account not found."
            });
        }

        return res.status(200).json({
            success: true,

            agent: {
                id: agent._id,
                fullName: agent.fullName,
                email: agent.email,
                applicationStatus:
                    agent.applicationStatus,
                status:
                    agent.status,
                rejectionReason:
                    agent.rejectionReason || null
            }
        });

    } catch (error) {

        console.error(
            "Get Agent session status error:",
            error
        );

        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token."
            });
        }

        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token has expired."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to check Agent session status."
        });
    }
}

module.exports = {
    getAgentSessionStatus
};