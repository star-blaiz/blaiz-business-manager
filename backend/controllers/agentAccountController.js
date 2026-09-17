const bcrypt = require("bcryptjs");
const Agent = require("../models/agent");


/* =========================
   GET AGENT ACCOUNT
========================= */

const getAgentAccount = async (req, res) => {

    try {

        const agent =
            await Agent.findById(
                req.agent._id
            ).select(
                "-passwordHash"
            );

        if (!agent) {

            return res.status(404).json({
                success: false,
                message: "Agent account not found."
            });

        }

        return res.status(200).json({

            success: true,

            agent: {

                fullName:
                    agent.fullName,

                nameKnownToPeople:
                    agent.nameKnownToPeople,

                nin:
                    agent.nin,

                dateOfBirth:
                    agent.dateOfBirth,

                gender:
                    agent.gender,

                relationshipStatus:
                    agent.relationshipStatus,

                phone:
                    agent.phone,

                email:
                    agent.email,

                currentAddress:
                    agent.currentAddress,

                state:
                    agent.state,

                lga:
                    agent.lga,

                homeAddress:
                    agent.homeAddress,

                bankAccountName:
                    agent.bankAccountName,

                bankAccountNumber:
                    agent.bankAccountNumber,

                bankName:
                    agent.bankName,

                bankDetailsUpdatedAt:
                    agent.bankDetailsUpdatedAt

            }

        });

    } catch (error) {

        console.error(
            "Get Agent Account Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load Agent account."

        });

    }

};


/* =========================
   UPDATE AGENT PROFILE
========================= */

const updateAgentProfile = async (
    req,
    res
) => {

    try {

        const agent =
            await Agent.findById(
                req.agent._id
            );

        if (!agent) {

            return res.status(404).json({

                success: false,

                message:
                    "Agent account not found."

            });

        }


        const {

            nameKnownToPeople,
            gender,
            relationshipStatus,
            phone,
            email,
            currentAddress,
            state,
            lga,
            homeAddress

        } = req.body;


        if (
            phone !== undefined &&
            !String(phone).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number is required."

            });

        }


        if (
            email !== undefined &&
            !String(email).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email address is required."

            });

        }


        if (
            nameKnownToPeople !== undefined
        ) {

            agent.nameKnownToPeople =
                String(
                    nameKnownToPeople
                ).trim();

        }


        if (
            gender !== undefined
        ) {

            agent.gender =
                String(
                    gender
                ).trim();

        }


        if (
            relationshipStatus !== undefined
        ) {

            agent.relationshipStatus =
                String(
                    relationshipStatus
                ).trim();

        }


        if (
            phone !== undefined
        ) {

            agent.phone =
                String(
                    phone
                ).trim();

        }


        if (
            email !== undefined
        ) {

            agent.email =
                String(
                    email
                ).trim()
                .toLowerCase();

        }


        if (
            currentAddress !== undefined
        ) {

            agent.currentAddress =
                String(
                    currentAddress
                ).trim();

        }


        if (
            state !== undefined
        ) {

            agent.state =
                String(
                    state
                ).trim();

        }


        if (
            lga !== undefined
        ) {

            agent.lga =
                String(
                    lga
                ).trim();

        }


        if (
            homeAddress !== undefined
        ) {

            agent.homeAddress =
                String(
                    homeAddress
                ).trim();

        }


        await agent.save();


        return res.status(200).json({

            success: true,

            message:
                "Profile updated successfully.",

            agent: {

                fullName:
                    agent.fullName,

                nameKnownToPeople:
                    agent.nameKnownToPeople,

                nin:
                    agent.nin,

                dateOfBirth:
                    agent.dateOfBirth,

                gender:
                    agent.gender,

                relationshipStatus:
                    agent.relationshipStatus,

                phone:
                    agent.phone,

                email:
                    agent.email,

                currentAddress:
                    agent.currentAddress,

                state:
                    agent.state,

                lga:
                    agent.lga,

                homeAddress:
                    agent.homeAddress

            }

        });

    } catch (error) {

        console.error(
            "Update Agent Profile Error:",
            error
        );


        if (
            error.code === 11000
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The phone number or email address is already in use."

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update Agent profile."

        });

    }

};


/* =========================
   UPDATE BANK DETAILS
========================= */

const updateAgentBankDetails = async (
    req,
    res
) => {

    try {

        const agent =
            await Agent.findById(
                req.agent._id
            );

        if (!agent) {

            return res.status(404).json({

                success: false,

                message:
                    "Agent account not found."

            });

        }


        const {

            bankAccountName,
            bankAccountNumber,
            bankName

        } = req.body;


        if (
            !bankAccountName ||
            !String(
                bankAccountName
            ).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Bank account name is required."

            });

        }


        if (
            !bankAccountNumber ||
            !String(
                bankAccountNumber
            ).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Bank account number is required."

            });

        }


        if (
            !bankName ||
            !String(
                bankName
            ).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Bank name is required."

            });

        }


        const cleanedAccountNumber =
            String(
                bankAccountNumber
            ).replace(
                /\s+/g,
                ""
            );


        if (
            !/^\d{10}$/.test(
                cleanedAccountNumber
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Bank account number must contain exactly 10 digits."

            });

        }


        agent.bankAccountName =
            String(
                bankAccountName
            ).trim();

        agent.bankAccountNumber =
            cleanedAccountNumber;

        agent.bankName =
            String(
                bankName
            ).trim();

        agent.bankDetailsUpdatedAt =
            new Date();


        await agent.save();


        return res.status(200).json({

            success: true,

            message:
                "Bank details saved successfully.",

            bankDetails: {

                bankAccountName:
                    agent.bankAccountName,

                bankAccountNumber:
                    agent.bankAccountNumber,

                bankName:
                    agent.bankName,

                bankDetailsUpdatedAt:
                    agent.bankDetailsUpdatedAt

            }

        });

    } catch (error) {

        console.error(
            "Update Agent Bank Details Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to save bank details."

        });

    }

};

/* =========================
   RESET AGENT PASSWORD
========================= */

const resetAgentPassword = async (
    req,
    res
) => {

    try {

        const agent =
            await Agent.findById(
                req.agent._id
            );

        if (!agent) {

            return res.status(404).json({

                success: false,

                message:
                    "Agent account not found."

            });

        }

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;


        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill in all password fields."

            });

        }


        if (
            newPassword.length < 8
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 8 characters long."

            });

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New passwords do not match."

            });

        }


        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                agent.passwordHash
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        const samePassword =
            await bcrypt.compare(
                newPassword,
                agent.passwordHash
            );


        if (samePassword) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from your current password."

            });

        }


        agent.passwordHash =
            await bcrypt.hash(
                newPassword,
                12
            );


        await agent.save();


        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully. Please log in again with your new password."

        });

    } catch (error) {

        console.error(
            "Reset Agent Password Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to reset password."

        });

    }

};


/* =========================
   DEACTIVATE AGENT ACCOUNT
========================= */

const deactivateAgentAccount = async (
    req,
    res
) => {

    try {

        const agent =
            await Agent.findById(
                req.agent._id
            );

        if (!agent) {

            return res.status(404).json({

                success: false,

                message:
                    "Agent account not found."

            });

        }


        if (
            agent.status ===
            "inactive"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This Agent account is already inactive."

            });

        }


        agent.status =
            "inactive";


        await agent.save();


        return res.status(200).json({

            success: true,

            message:
                "Agent account deactivated successfully."

        });

    } catch (error) {

        console.error(
            "Deactivate Agent Account Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to deactivate Agent account."

        });

    }

};


module.exports = {

    getAgentAccount,

    updateAgentProfile,

    updateAgentBankDetails,

    resetAgentPassword,

    deactivateAgentAccount

};
