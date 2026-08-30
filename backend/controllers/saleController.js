const mongoose = require("mongoose");

const Sale = require("../models/sale");
const Product = require("../models/product");
const Customer = require("../models/customer");
const Receipt = require("../models/receipt");
const Store = require("../models/store");

const { getPlanLimits } = require("../utils/planLimits");


/* =========================================================
   REFRESH STORE PLAN
========================================================= */

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


/* =========================================================
   GENERATE RECEIPT NUMBER
========================================================= */

const generateReceiptNumber = async (storeId) => {

    const latestReceipt =
        await Receipt.findOne({
            storeId,
        })
            .sort({
                createdAt: -1,
            })
            .lean();


    let nextNumber = 1;


    if (
        latestReceipt &&
        latestReceipt.receiptNumber
    ) {

        const match =
            latestReceipt.receiptNumber.match(
                /\d+$/
            );


        if (match) {

            nextNumber =
                Number(match[0]) + 1;

        }

    }


    return `#${String(nextNumber).padStart(6, "0")}`;

};


/* =========================================================
   CREATE SALE
========================================================= */

const createSale = async (req, res) => {

    const session =
        await mongoose.startSession();


    try {

        const {
            customerId,
            items,
            discount,
            amountPaid,
            paymentMethod,
        } = req.body;


        /* =====================================================
           VALIDATE ITEMS
        ===================================================== */

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A sale must contain at least one product.",

            });

        }


        /* =====================================================
           FIND STORE
        ===================================================== */

        const store =
            await Store.findById(
                req.user.storeId
            );


        if (!store) {

            return res.status(404).json({

                success: false,

                message:
                    "Store not found.",

            });

        }


        /* =====================================================
           CHECK / REFRESH PREMIUM
        ===================================================== */

        await refreshStorePlan(store);


        /* =====================================================
           FREE PLAN SALES LIMIT
           
           Premium users are NOT restricted to 5 sales.
        ===================================================== */

        const limits =
            getPlanLimits(
                store.plan
            );


        if (store.plan === "free") {

            const saleCount =
                await Sale.countDocuments({
                    storeId: store._id,
                });


            if (
                saleCount >= limits.sales
            ) {

                return res.status(403).json({

                    success: false,

                    code:
                        "SALE_LIMIT_REACHED",

                    message:
                        "You have reached the maximum usage. Upgrade to Premium to continue using.",

                });

            }

        }


        /* =====================================================
           CUSTOMER
        ===================================================== */

        let customer = null;


        if (customerId) {

            if (
                !mongoose.Types.ObjectId.isValid(
                    customerId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid customer.",

                });

            }


            customer =
                await Customer.findOne({

                    _id: customerId,

                    storeId: store._id,

                });


            if (!customer) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Customer not found.",

                });

            }

        }


        /* =====================================================
           PAYMENT METHOD
        ===================================================== */

        const allowedPaymentMethods = [
            "cash",
            "transfer",
            "pos",
            "other",
        ];


        const selectedPaymentMethod =
            paymentMethod || "cash";


        if (
            !allowedPaymentMethods.includes(
                selectedPaymentMethod
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment method.",

            });

        }


        /* =====================================================
           DISCOUNT / AMOUNT PAID
        ===================================================== */

        const parsedDiscount =
            Number(discount || 0);


        const parsedAmountPaid =
            Number(amountPaid || 0);


        if (
            !Number.isFinite(
                parsedDiscount
            ) ||
            parsedDiscount < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid discount.",

            });

        }


        if (
            !Number.isFinite(
                parsedAmountPaid
            ) ||
            parsedAmountPaid < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid amount paid.",

            });

        }


        /* =====================================================
           NORMALIZE PRODUCTS
        ===================================================== */

        const normalizedItems = [];


        let subtotal = 0;

        let totalBuyingCost = 0;


        for (const item of items) {

            if (
                !item.productId ||
                !mongoose.Types.ObjectId.isValid(
                    item.productId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid product in sale.",

                });

            }


            const quantity =
                Number(item.quantity);


            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Every product quantity must be greater than zero.",

                });

            }


            const product =
                await Product.findOne({

                    _id: item.productId,

                    storeId: store._id,

                });


            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "One of the selected products was not found.",

                });

            }


            if (
                quantity > product.quantity
            ) {

                return res.status(400).json({

                    success: false,

                    code:
                        "INSUFFICIENT_STOCK",

                    message:
                        `${product.name} does not have enough stock. Available: ${product.quantity}.`,

                });

            }


            const unitPrice =
                Number(
                    product.sellingPrice
                );


            const buyingPrice =
                Number(
                    product.buyingPrice
                );


            const itemTotal =
                unitPrice * quantity;


            const itemBuyingCost =
                buyingPrice * quantity;


            subtotal += itemTotal;

            totalBuyingCost +=
                itemBuyingCost;


            normalizedItems.push({

                product,

                quantity,

                unitPrice,

                buyingPrice,

                itemTotal,

            });

        }


        /* =====================================================
           VALIDATE DISCOUNT
        ===================================================== */

        if (
            parsedDiscount > subtotal
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Discount cannot be greater than the sale subtotal.",

            });

        }


        /* =====================================================
           FINANCIAL CALCULATIONS
        ===================================================== */

        const totalAmount =
            subtotal -
            parsedDiscount;


        if (
            parsedAmountPaid >
            totalAmount
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Amount paid cannot be greater than the total amount.",

            });

        }


        const debt =
            totalAmount -
            parsedAmountPaid;


        const profit =
            totalAmount -
            totalBuyingCost;


        /* =====================================================
           SALE ITEMS
        ===================================================== */

        const saleItems =
            normalizedItems.map(
                ({
                    product,
                    quantity,
                    unitPrice,
                    buyingPrice,
                    itemTotal,
                }) => ({

                    productId:
                        product._id,

                    productName:
                        product.name,

                    quantity,

                    unitPrice,

                    buyingPrice,

                    total:
                        itemTotal,

                })
            );


        /* =====================================================
           RECEIPT NUMBER
        ===================================================== */

        const receiptNumber =
            await generateReceiptNumber(
                store._id
            );


        /* =====================================================
           DATABASE TRANSACTION
        ===================================================== */

        let createdSale;


        await session.withTransaction(
            async () => {

                /* =============================================
                   DEDUCT STOCK
                ============================================= */

                for (
                    const item
                    of normalizedItems
                ) {

                    const updatedProduct =
                        await Product.findOneAndUpdate(

                            {

                                _id:
                                    item.product._id,

                                storeId:
                                    store._id,

                                quantity: {
                                    $gte:
                                        item.quantity,
                                },

                            },

                            {

                                $inc: {

                                    quantity:
                                        -item.quantity,

                                },

                            },

                            {

                                new: true,

                                session,

                            }

                        );


                    if (!updatedProduct) {

                        throw new Error(

                            `Stock changed while recording ${item.product.name}. Please try again.`

                        );

                    }

                }


                /* =============================================
                   CREATE SALE
                ============================================= */

                const saleDocuments =
                    await Sale.create(

                        [
                            {

                                storeId:
                                    store._id,

                                customerId:
                                    customer
                                        ? customer._id
                                        : null,

                                customerName:
                                    customer
                                        ? customer.name
                                        : "Walk-in Customer",

                                        receiptNumber:
                                            receiptNumber,

                                items:
                                    saleItems,

                                subtotal,

                                discount:
                                    parsedDiscount,

                                totalAmount,

                                amountPaid:
                                    parsedAmountPaid,

                                debt,

                                profit,

                                soldBy:
                                    req.user._id,

                                paymentMethod:
                                    selectedPaymentMethod,

                            },
                        ],

                        {
                            session,
                        }

                    );


                createdSale =
                    saleDocuments[0];


                /* =============================================
                   UPDATE CUSTOMER
                ============================================= */

                if (customer) {

                    customer.totalPurchases +=
                        totalAmount;


                    customer.totalPaid +=
                        parsedAmountPaid;


                    customer.outstandingDebt +=
                        debt;


                    await customer.save({

                        session,

                    });

                }


                /* =============================================
                   CREATE RECEIPT
                ============================================= */

                await Receipt.create(

                    [
                        {

                            storeId:
                                store._id,

                            saleId:
                                createdSale._id,

                            receiptNumber,

                            customerId:
                                customer
                                    ? customer._id
                                    : null,

                            customerName:
                                customer
                                    ? customer.name
                                    : "Walk-in Customer",

                            totalAmount,

                            amountPaid:
                                parsedAmountPaid,

                            debt,

                            issuedBy:
                                req.user._id,

                        },
                    ],

                    {
                        session,
                    }

                );

            }

        );


        /* =====================================================
           SUCCESS RESPONSE
        ===================================================== */

        return res.status(201).json({

            success: true,

            message:
                "Sale recorded successfully.",

            sale:
                createdSale,

            receiptNumber,

            financialSummary: {

                subtotal,

                discount:
                    parsedDiscount,

                totalAmount,

                amountPaid:
                    parsedAmountPaid,

                debt,

                profit,

            },

        });


    } catch (error) {

        console.error(
            "Create sale error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to record sale.",

        });


    } finally {

        await session.endSession();

    }

};


/* =========================================================
   GET ALL SALES
========================================================= */
const getSales = async (req, res) => {

    try {

        const sales =
            await Sale.find({

                storeId:
                    req.user.storeId,

            })

                .populate(
                    "soldBy",
                    "name role"
                )

                .populate(
                    "customerId",
                    "name phone"
                )

                .sort({

                    createdAt: -1,

                })
                .lean();


        /*
         * Get receipt numbers for these sales.
         *
         * Receipts are stored separately from sales,
         * so we attach the matching receipt number
         * to each sale before sending it to the frontend.
         */

        const saleIds =
            sales.map(
                (sale) => sale._id
            );


        const receipts =
            await Receipt.find({

                storeId:
                    req.user.storeId,

                saleId: {
                    $in: saleIds,
                },

            })
                .select(
                    "saleId receiptNumber"
                )
                .lean();


        /*
         * Create a quick lookup:
         *
         * saleId → receiptNumber
         */

        const receiptMap =
            new Map();


        receipts.forEach(
            (receipt) => {

                receiptMap.set(
                    receipt.saleId.toString(),
                    receipt.receiptNumber
                );

            }
        );


        /*
         * Attach receiptNumber to every sale.
         */

        const salesWithReceipts =
            sales.map(
                (sale) => {

                    return {

                        ...sale,

                        receiptNumber:
                            receiptMap.get(
                                sale._id.toString()
                            ) || null,

                    };

                }
            );


        return res.status(200).json({

            success: true,

            sales:
                salesWithReceipts,

            count:
                salesWithReceipts.length,

        });


    } catch (error) {

        console.error(
            "Get sales error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load sales.",

        });

    }

};

/* =========================================================
   GET SINGLE SALE
========================================================= */

const getSale = async (req, res) => {

    try {

        const sale =
            await Sale.findOne({

                _id:
                    req.params.saleId,

                storeId:
                    req.user.storeId,

            })

                .populate(
                    "soldBy",
                    "name role"
                )

                .populate(
                    "customerId",
                    "name phone email"
                );


        if (!sale) {

            return res.status(404).json({

                success: false,

                message:
                    "Sale not found.",

            });

        }


        /* =====================================================
           GET RECEIPT NUMBER
           
           New sales have receiptNumber inside Sale.
           
           Older sales may not have it, so we look inside
           the Receipt collection.
        ===================================================== */

        let receiptNumber =
            sale.receiptNumber;


        if (!receiptNumber) {

            const receipt =
                await Receipt.findOne({

                    saleId:
                        sale._id,

                    storeId:
                        req.user.storeId,

                }).lean();


            if (receipt) {

                receiptNumber =
                    receipt.receiptNumber;

            }

        }


        return res.status(200).json({

            success: true,

            sale: {

                ...sale.toObject(),

                receiptNumber:
                    receiptNumber ||
                    "Not available",

            },

        });


    } catch (error) {

        console.error(
            "Get sale error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load sale.",

        });

    }

};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createSale,

    getSales,

    getSale,

};