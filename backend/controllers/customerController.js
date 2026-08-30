const Customer = require("../models/customer");
const Store = require("../models/store");

const { getPlanLimits } = require("../utils/planLimits");

const refreshStorePlan = async (store) => {
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

  return store;
};

const addCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    const store = await Store.findById(req.user.storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    await refreshStorePlan(store);

    const limits = getPlanLimits(store.plan);

    const customerCount = await Customer.countDocuments({
      storeId: store._id,
    });

    if (customerCount >= limits.customers) {
      return res.status(403).json({
        success: false,
        code: "CUSTOMER_LIMIT_REACHED",
        message:
          "You have reached the Free plan limit of 5 customers. Upgrade to Premium to add unlimited customers.",
      });
    }

    if (phone && phone.trim()) {
      const existingCustomer = await Customer.findOne({
        storeId: store._id,
        phone: phone.trim(),
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "A customer with this phone number already exists in your store.",
        });
      }
    }

    const customer = await Customer.create({
      storeId: store._id,

      name: name.trim(),

      phone: phone
        ? phone.trim()
        : "",

      email: email
        ? email.trim().toLowerCase()
        : "",

      address: address
        ? address.trim()
        : "",

      totalPurchases: 0,

      totalPaid: 0,

      outstandingDebt: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Customer added successfully.",
      customer,
    });
  } catch (error) {
    console.error("Add customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add customer.",
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      storeId: req.user.storeId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      customers,
      count: customers.length,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customers.",
    });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      storeId: req.user.storeId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customer.",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
    } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.customerId,
      storeId: req.user.storeId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer name cannot be empty.",
        });
      }

      customer.name = name.trim();
    }

    if (phone !== undefined) {
      const newPhone = phone.trim();

      if (
        newPhone &&
        newPhone !== customer.phone
      ) {
        const existingCustomer =
          await Customer.findOne({
            storeId: req.user.storeId,
            phone: newPhone,
            _id: {
              $ne: customer._id,
            },
          });

        if (existingCustomer) {
          return res.status(409).json({
            success: false,
            message:
              "Another customer already uses this phone number.",
          });
        }
      }

      customer.phone = newPhone;
    }

    if (email !== undefined) {
      customer.email = email
        .trim()
        .toLowerCase();
    }

    if (address !== undefined) {
      customer.address = address.trim();
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer.",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      storeId: req.user.storeId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (customer.outstandingDebt > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This customer cannot be deleted while they have outstanding debt.",
      });
    }

    await Customer.deleteOne({
      _id: customer._id,
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete customer.",
    });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const query = req.query.q
      ? req.query.q.trim()
      : "";

    if (!query) {
      return res.status(200).json({
        success: true,
        customers: [],
      });
    }

    const regex = new RegExp(query, "i");

    const customers = await Customer.find({
      storeId: req.user.storeId,

      $or: [
        {
          name: regex,
        },
        {
          phone: regex,
        },
        {
          email: regex,
        },
      ],
    })
      .limit(20)
      .sort({
        name: 1,
      });

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Search customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search customers.",
    });
  }
};

module.exports = {
  addCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
};