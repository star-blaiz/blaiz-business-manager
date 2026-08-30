const Receipt = require("../models/receipt");
const Sale = require("../models/sale");
const Store = require("../models/store");

const verifyReceipt = async (req, res) => {
  try {
    let { receiptNumber } = req.body;

    if (!receiptNumber) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Please enter a receipt number.",
      });
    }

    receiptNumber = receiptNumber.trim();

    /*
     * Allow customers to enter:
     *
     * #000001
     * 000001
     *
     * Internally we store:
     *
     * #000001
     */

    if (!receiptNumber.startsWith("#")) {
      receiptNumber = `#${receiptNumber}`;
    }

    const receipt = await Receipt.findOne({
      receiptNumber,
    }).lean();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        verified: false,
        message:
          "Receipt not found. Please check the receipt number and try again.",
      });
    }

    const store = await Store.findById(
      receipt.storeId
    ).lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        verified: false,
        message:
          "This receipt could not be verified because the store no longer exists.",
      });
    }

    const sale = await Sale.findOne({
      _id: receipt.saleId,
      storeId: receipt.storeId,
    })
      .populate("soldBy", "name role")
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        verified: false,
        message:
          "Receipt record is incomplete and could not be verified.",
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,

      message: "Receipt verified successfully.",

      receipt: {
        receiptNumber: receipt.receiptNumber,

        date: receipt.createdAt,

        store: {
          id: store._id,
          name: store.storeName,
          phone: store.phone || "",
          email: store.email || "",
          address: store.address || "",
        },

        customer: {
          name: receipt.customerName,
        },

        sale: {
          items: sale.items,

          subtotal: sale.subtotal,

          discount: sale.discount,

          totalAmount: sale.totalAmount,

          amountPaid: sale.amountPaid,

          debt: sale.debt,

          paymentMethod: sale.paymentMethod,

        },

        soldBy: sale.soldBy
          ? {
              name: sale.soldBy.name,
              role: sale.soldBy.role,
            }
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Verify receipt error:",
      error
    );

    return res.status(500).json({
      success: false,
      verified: false,
      message:
        "Unable to verify receipt at the moment.",
    });
  }
};

const getReceipt = async (req, res) => {
  try {
    let { receiptNumber } = req.params;

    receiptNumber = decodeURIComponent(
      receiptNumber
    ).trim();

    if (!receiptNumber.startsWith("#")) {
      receiptNumber = `#${receiptNumber}`;
    }

    const receipt = await Receipt.findOne({
      receiptNumber,
      storeId: req.user.storeId,
    }).lean();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found.",
      });
    }

    const store = await Store.findById(
      receipt.storeId
    ).lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const sale = await Sale.findOne({
      _id: receipt.saleId,
      storeId: receipt.storeId,
    })
      .populate(
        "soldBy",
        "name role"
      )
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message:
          "The sale associated with this receipt was not found.",
      });
    }

    return res.status(200).json({
      success: true,

      receipt: {
        receiptNumber:
          receipt.receiptNumber,

        date: receipt.createdAt,

        store: {
          id: store._id,

          name:
            store.storeName,

          phone:
            store.phone || "",

          email:
            store.email || "",

          address:
            store.address || "",

          logo:
            store.logo || null,
        },

        customer: {
          name:
            receipt.customerName,
        },

        items: sale.items.map(
          (item) => ({
            productId:
              item.productId,

            productName:
              item.productName,

            quantity:
              item.quantity,

            unitPrice:
              item.unitPrice,

            total:
              item.total,
          })
        ),

        subtotal:
          sale.subtotal,

        discount:
          sale.discount,

        totalAmount:
          sale.totalAmount,

        amountPaid:
          sale.amountPaid,

        debt:
          sale.debt,

        paymentMethod:
          sale.paymentMethod,

        soldBy:
          sale.soldBy
            ? {
                name:
                  sale.soldBy.name,

                role:
                  sale.soldBy.role,
              }
            : null,
      },
    });
  } catch (error) {
    console.error(
      "Get receipt error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load receipt.",
    });
  }
};

const getReceipts = async (req, res) => {

  try {

    const receipts = await Receipt.find({
      storeId: req.user.storeId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();


    return res.status(200).json({

      success: true,

      receipts,

      count: receipts.length,

    });

  } catch (error) {

    console.error(
      "Get receipts error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to load receipts.",

    });

  }

};

module.exports = {
  verifyReceipt,
  getReceipt,
  getReceipts,
};