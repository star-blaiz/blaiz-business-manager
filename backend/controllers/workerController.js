const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Store = require("../models/store");

const { getPlanLimits } = require("../utils/planLimits");

const addWorker = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
    } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, password and role are required.",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Worker email or phone number is required.",
      });
    }

    if (!["sales", "inventory"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Worker role must be sales or inventory.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Worker password must contain at least 6 characters.",
      });
    }

    const store = await Store.findOne({
      _id: req.user.storeId,
      ownerId: req.user._id,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    /*
     * Check subscription expiry.
     */

    const now = new Date();

    if (
      store.plan === "premium" &&
      store.subscriptionExpiry &&
      store.subscriptionExpiry <= now
    ) {
      store.plan = "free";
      store.subscriptionStatus = "expired";

      await store.save();
    }

    const limits = getPlanLimits(store.plan);

    const workerCount = await User.countDocuments({
      storeId: store._id,
      accountType: "worker",
    });

    if (workerCount >= limits.workers) {
      return res.status(403).json({
        success: false,
        code: "WORKER_LIMIT_REACHED",
        message:
          "You have reached your Free plan worker limit. Upgrade to Premium to add unlimited workers.",
      });
    }

    const normalizedEmail = email
      ? email.trim().toLowerCase()
      : undefined;

    const normalizedPhone = phone
      ? phone.trim()
      : undefined;

    const duplicateConditions = [];

    if (normalizedEmail) {
      duplicateConditions.push({
        email: normalizedEmail,
      });
    }

    if (normalizedPhone) {
      duplicateConditions.push({
        phone: normalizedPhone,
      });
    }

    const existingUser = await User.findOne({
      $or: duplicateConditions,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email or phone number already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const worker = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      accountType: "worker",
      role,
      storeId: store._id,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Worker added successfully.",
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role,
        status: worker.status,
        storeId: worker.storeId,
      },
    });
  } catch (error) {
    console.error("Add worker error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add worker.",
    });
  }
};

const getWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      storeId: req.user.storeId,
      accountType: "worker",
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      workers,
      count: workers.length,
    });
  } catch (error) {
    console.error("Get workers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load workers.",
    });
  }
};

const updateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const {
      name,
      email,
      phone,
      role,
      status,
    } = req.body;

    if (
      role !== undefined &&
      !["sales", "inventory"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Role must be sales or inventory.",
      });
    }

    if (
      status !== undefined &&
      !["active", "suspended", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker status.",
      });
    }

    const worker = await User.findOne({
      _id: workerId,
      storeId: req.user.storeId,
      accountType: "worker",
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found.",
      });
    }

    if (name !== undefined) {
      worker.name = name.trim();
    }

    if (email !== undefined) {
      worker.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      worker.phone = phone.trim();
    }

    if (role !== undefined) {
      worker.role = role;
    }

    if (status !== undefined) {
      worker.status = status;
    }

    await worker.save();

    return res.status(200).json({
      success: true,
      message: "Worker updated successfully.",
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role,
        status: worker.status,
      },
    });
  } catch (error) {
    console.error("Update worker error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update worker.",
    });
  }
};

const deleteWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    const worker = await User.findOne({
      _id: workerId,
      storeId: req.user.storeId,
      accountType: "worker",
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found.",
      });
    }

    await User.deleteOne({
      _id: worker._id,
    });

    return res.status(200).json({
      success: true,
      message: "Worker removed successfully.",
    });
  } catch (error) {
    console.error("Delete worker error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove worker.",
    });
  }
};

module.exports = {
  addWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
};