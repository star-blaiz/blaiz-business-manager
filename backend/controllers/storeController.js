const Store = require("../models/store");
const User = require("../models/user");

const Product = require("../models/product");
const Customer = require("../models/customer");
const Sale = require("../models/sale");
const Receipt = require("../models/receipt");


/* =========================================
   GET MY STORE
========================================= */

const getMyStore = async (req, res) => {
  try {
    const store = await Store.findById(req.user.storeId).populate(
      "ownerId",
      "name email phone"
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    return res.status(200).json({
      success: true,
      store,
    });

  } catch (error) {

    console.error("Get store error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load store.",
    });
  }
};


/* =========================================
   UPDATE STORE
========================================= */

const updateStore = async (req, res) => {
  try {

    const {
      storeName,
      phone,
      email,
      address,
      businessType,
    } = req.body;


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


    if (storeName !== undefined) {

      if (!storeName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Store name cannot be empty.",
        });
      }

      store.storeName = storeName.trim();
    }


    if (phone !== undefined) {
      store.phone = phone.trim();
    }


    if (email !== undefined) {
      store.email = email.trim().toLowerCase();
    }


    if (address !== undefined) {
      store.address = address.trim();
    }


    if (businessType !== undefined) {
      store.businessType = businessType.trim();
    }


    await store.save();


    return res.status(200).json({
      success: true,
      message: "Store information updated successfully.",
      store,
    });

  } catch (error) {

    console.error("Update store error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update store.",
    });
  }
};


/* =========================================
   DELETE MY STORE
========================================= */

const deleteStore = async (req, res) => {

  const session = await Store.startSession();

  try {

    /* -----------------------------------------
       ONLY OWNER CAN DELETE STORE
    ----------------------------------------- */

    if (
      req.user.accountType !== "owner" ||
      req.user.role !== "owner"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Only the store owner can delete the store.",
      });

    }


    /* -----------------------------------------
       FIND STORE
    ----------------------------------------- */

    const store = await Store.findOne({
      _id: req.user.storeId,
      ownerId: req.user._id,
    }).session(session);


    if (!store) {

      return res.status(404).json({
        success: false,
        message:
          "Store not found.",
      });

    }


    const storeId = store._id;


    /* -----------------------------------------
       START TRANSACTION
    ----------------------------------------- */

    await session.withTransaction(
      async () => {

        /* =====================================
           DELETE PRODUCTS
        ===================================== */

        await Product.deleteMany(
          {
            storeId,
          },
          {
            session,
          }
        );


        /* =====================================
           DELETE CUSTOMERS
        ===================================== */

        await Customer.deleteMany(
          {
            storeId,
          },
          {
            session,
          }
        );


        /* =====================================
           DELETE SALES
        ===================================== */

        await Sale.deleteMany(
          {
            storeId,
          },
          {
            session,
          }
        );


        /* =====================================
           DELETE RECEIPTS
        ===================================== */

        await Receipt.deleteMany(
          {
            storeId,
          },
          {
            session,
          }
        );


        /* =====================================
           DELETE ALL WORKERS
        ===================================== */

        await User.deleteMany(
          {
            storeId,
            accountType: "worker",
          },
          {
            session,
          }
        );


        /* =====================================
           DELETE STORE
        ===================================== */

        await Store.deleteOne(
          {
            _id: storeId,
          },
          {
            session,
          }
        );


        /* =====================================
           DELETE OWNER ACCOUNT
        ===================================== */

        await User.deleteOne(
          {
            _id: req.user._id,
            accountType: "owner",
            role: "owner",
          },
          {
            session,
          }
        );

      }
    );


    /* -----------------------------------------
       SUCCESS
    ----------------------------------------- */

    return res.status(200).json({

      success: true,

      message:
        "Your store and all associated data have been permanently deleted.",

    });


  } catch (error) {

    console.error(
      "Delete store error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to delete store. Please try again.",

    });


  } finally {

    await session.endSession();

  }

};

module.exports = {
  getMyStore,
  updateStore,
  deleteStore,
};