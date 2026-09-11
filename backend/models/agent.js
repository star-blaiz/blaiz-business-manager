const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    // =========================================
    // PERSONAL INFORMATION
    // =========================================

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    nameKnownToPeople: {
      type: String,
      required: true,
      trim: true,
    },

    nin: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },

    relationshipStatus: {
      type: String,
      enum: [
        "Single",
        "Married",
        "Divorced",
        "Widowed",
        "Separated",
      ],
      required: true,
    },

    // =========================================
    // CONTACT INFORMATION
    // =========================================

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    currentAddress: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    lga: {
      type: String,
      required: true,
      trim: true,
    },

    homeAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================================
    // AUTHENTICATION
    // =========================================

    passwordHash: {
      type: String,
      required: true,
    },

    // =========================================
    // APPLICATION STATUS
    // =========================================

    applicationStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================================
    // ACCOUNT STATUS
    // =========================================

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "suspended",
        "inactive",
      ],
      default: "pending",
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // =========================================
    // TERMS & PRIVACY CONSENT
    // =========================================

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    termsVersion: {
      type: String,
      default: null,
      trim: true,
    },

    privacyPolicyVersion: {
      type: String,
      default: null,
      trim: true,
    },

    // =========================================
    // REFERRAL INFORMATION
    // =========================================

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    // =========================================
    // BANK ACCOUNT
    // These are NOT required during registration.
    // They will be required when the agent saves
    // bank details from the Agent Dashboard.
    // =========================================

    bankAccountName: {
      type: String,
      default: null,
      trim: true,
    },

    bankAccountNumber: {
      type: String,
      default: null,
      trim: true,
    },

    bankName: {
      type: String,
      default: null,
      trim: true,
    },

    bankDetailsUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// INDEXES
// =========================================

agentSchema.index(
  { email: 1 },
  {
    unique: true,
  }
);

agentSchema.index(
  { phone: 1 },
  {
    unique: true,
  }
);

agentSchema.index(
  { nin: 1 },
  {
    unique: true,
  }
);

agentSchema.index(
  { referralCode: 1 },
  {
    unique: true,
    sparse: true,
  }
);

module.exports = mongoose.model(
  "Agent",
  agentSchema
);