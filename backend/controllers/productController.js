const Product = require("../models/product");
const Store = require("../models/store");
const { getPlanLimits } = require("../utils/planLimits");

const {
  notifyStoreUsers,
} = require("../services/notificationService");

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

const addProduct = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      buyingPrice,
      sellingPrice,
      quantity,
      minimumStock,
      description,
      image,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (
      buyingPrice === undefined ||
      sellingPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Buying price and selling price are required.",
      });
    }

    if (Number(buyingPrice) < 0 || Number(sellingPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: "Prices cannot be negative.",
      });
    }

    if (Number(quantity || 0) < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative.",
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

    const productCount = await Product.countDocuments({
      storeId: store._id,
    });

    if (productCount >= limits.products) {
      return res.status(403).json({
        success: false,
        code: "PRODUCT_LIMIT_REACHED",
        message:
          "You have reached the Free plan limit of 5 products. Upgrade to Premium to add unlimited products.",
      });
    }

    if (code && code.trim()) {
      const existingCode = await Product.findOne({
        storeId: store._id,
        code: code.trim(),
      });

      if (existingCode) {
        return res.status(409).json({
          success: false,
          message:
            "A product with this code already exists in your store.",
        });
      }
    }

    const product = await Product.create({
      storeId: store._id,

      name: name.trim(),

      code: code ? code.trim() : "",

      category: category
        ? category.trim()
        : "",

      buyingPrice: Number(buyingPrice),

      sellingPrice: Number(sellingPrice),

      quantity: Number(quantity || 0),

      minimumStock: Number(minimumStock || 5),

      description: description
        ? description.trim()
        : "",

      image: image || null,

      createdBy: req.user._id,
    });

    /* =====================================================
   PRODUCT CREATED NOTIFICATION
========================================================= */

try {
  await notifyStoreUsers({
    storeId: store._id,

    actorId: req.user._id,

    category: "product",

    type: "product_created",

    title: "New Product",

    message:
      `${req.user.name} added a new product: ${product.name}.`,

    relatedId: product._id,

    reference: product.code || null,
  });
} catch (notificationError) {
  /*
   * Notification failure must NOT make
   * an already successful product creation fail.
   */

  console.error(
    "Product creation notification error:",
    notificationError
  );
}

    return res.status(201).json({
      success: true,
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add product.",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      storeId: req.user.storeId,
    })
      .sort({ productName: 1 })
      .lean();

    const productsWithStockStatus = products.map(
      (product) => ({
        ...product,

        stockStatus:
          product.quantity <= 0
            ? "out"
            : product.quantity <= product.minimumStock
            ? "low"
            : "in_stock",
      })
    );

    return res.status(200).json({
      success: true,
      products: productsWithStockStatus,
      count: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load products.",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      storeId: req.user.storeId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load product.",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      buyingPrice,
      sellingPrice,
      quantity,
      minimumStock,
      description,
      image,
    } = req.body;

    const product = await Product.findOne({
      _id: req.params.productId,
      storeId: req.user.storeId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty.",
        });
      }

      product.name = name.trim();
    }

    if (code !== undefined) {
      const newCode = code.trim();

      if (newCode && newCode !== product.code) {
        const existingCode = await Product.findOne({
          storeId: req.user.storeId,
          code: newCode,
          _id: { $ne: product._id },
        });

        if (existingCode) {
          return res.status(409).json({
            success: false,
            message:
              "Another product already uses this code.",
          });
        }
      }

      product.code = newCode;
    }

    if (category !== undefined) {
      product.category = category.trim();
    }

    if (buyingPrice !== undefined) {
      if (Number(buyingPrice) < 0) {
        return res.status(400).json({
          success: false,
          message: "Buying price cannot be negative.",
        });
      }

      product.buyingPrice = Number(buyingPrice);
    }

    if (sellingPrice !== undefined) {
      if (Number(sellingPrice) < 0) {
        return res.status(400).json({
          success: false,
          message: "Selling price cannot be negative.",
        });
      }

      product.sellingPrice = Number(sellingPrice);
    }

    if (quantity !== undefined) {
      if (Number(quantity) < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity cannot be negative.",
        });
      }

      product.quantity = Number(quantity);
    }

    if (minimumStock !== undefined) {
      if (Number(minimumStock) < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum stock cannot be negative.",
        });
      }

      product.minimumStock = Number(minimumStock);
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (image !== undefined) {
      product.image = image;
    }

    await product.save();

    /* =====================================================
   PRODUCT UPDATED NOTIFICATION
========================================================= */

try {
  await notifyStoreUsers({
    storeId: product.storeId,

    actorId: req.user._id,

    category: "product",

    type: "product_updated",

    title: "Product Updated",

    message:
      `${req.user.name} updated product: ${product.name}.`,

    relatedId: product._id,

    reference: product.code || null,
  });
} catch (notificationError) {
  /*
   * Notification failure must NOT make
   * an already successful product update fail.
   */

  console.error(
    "Product update notification error:",
    notificationError
  );
}

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update product.",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      storeId: req.user.storeId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    await Product.deleteOne({
      _id: product._id,
    });

    /* =====================================================
   PRODUCT DELETED NOTIFICATION
========================================================= */

try {
  await notifyStoreUsers({
    storeId: product.storeId,

    actorId: req.user._id,

    category: "product",

    type: "product_deleted",

    title: "Product Deleted",

    message:
      `${req.user.name} deleted product: ${product.name}.`,

    relatedId: product._id,

    reference: product.code || null,
  });
} catch (notificationError) {
  /*
   * Notification failure must NOT make
   * an already successful product deletion fail.
   */

  console.error(
    "Product deletion notification error:",
    notificationError
  );
}

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete product.",
    });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { quantity, type } = req.body;

    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero.",
      });
    }

    if (!["add", "remove"].includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Stock adjustment type must be add or remove.",
      });
    }

    const product = await Product.findOne({
      _id: req.params.productId,
      storeId: req.user.storeId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (type === "add") {
      product.quantity += amount;
    } else {
      if (amount > product.quantity) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove more stock than is available.",
        });
      }

      product.quantity -= amount;
    }

    await product.save();

    /* =====================================================
   STOCK ADJUSTMENT NOTIFICATION
========================================================= */

try {
  const stockAction =
    type === "add"
      ? "added"
      : "removed";

  await notifyStoreUsers({
    storeId: product.storeId,

    actorId: req.user._id,

    category: "inventory",

    type:
      type === "add"
        ? "stock_added"
        : "stock_removed",

    title:
      type === "add"
        ? "Stock Added"
        : "Stock Removed",

    message:
      `${req.user.name} ${stockAction} ${amount} unit(s) of ${product.name}. Current stock: ${product.quantity}.`,

    relatedId: product._id,

    reference: product.code || null,
  });
} catch (notificationError) {
  console.error(
    "Stock adjustment notification error:",
    notificationError
  );
}


/* =====================================================
   LOW STOCK / OUT OF STOCK NOTIFICATION
========================================================= */

if (product.quantity <= product.minimumStock) {
  try {
    const stockStatus =
      product.quantity <= 0
        ? "out of stock"
        : "low on stock";

    await notifyStoreUsers({
      storeId: product.storeId,

      actorId: req.user._id,

      category: "inventory",

      type:
        product.quantity <= 0
          ? "stock_out"
          : "stock_low",

      title:
        product.quantity <= 0
          ? "Product Out of Stock"
          : "Low Stock Alert",

      message:
        `${product.name} is ${stockStatus}. Current stock: ${product.quantity}. Minimum stock level: ${product.minimumStock}.`,

      relatedId: product._id,

      reference: product.code || null,
    });
  } catch (stockNotificationError) {
    console.error(
      "Low stock notification error:",
      stockNotificationError
    );
  }
}

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Adjust stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update stock.",
    });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      storeId: req.user.storeId,
      $expr: {
        $lte: ["$quantity", "$minimumStock"],
      },
    }).sort({
      quantity: 1,
    });

    return res.status(200).json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Low stock error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load low-stock products.",
    });
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStockProducts,
};