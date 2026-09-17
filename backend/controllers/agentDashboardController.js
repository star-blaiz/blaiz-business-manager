const Agent = require("../models/agent");
const Store = require("../models/store");
const Commission =
  require("../models/commission");

/* =========================================
   GET AGENT DASHBOARD
========================================= */

const getAgentDashboard = async (req, res) => {
  try {

    const agent =
      req.agent;

    if (!agent) {
      return res.status(401).json({
        success: false,
        message: "Agent authentication required.",
      });
    }


    /* =========================================
       FIND REFERRED STORES
    ========================================= */

    const referredStores =
      await Store.find({
        agentId: agent._id,
      })
      .sort({
        createdAt: -1,
      })
      .select(
        "storeName businessType plan subscriptionStatus subscriptionExpiry createdAt"
      );


    /* =========================================
       CALCULATE STORE COUNTS
    ========================================= */

    const referredStoresCount =
      referredStores.length;


    const premiumStoresCount =
      referredStores.filter(
        (store) =>
          store.plan === "premium" &&
          store.subscriptionStatus === "active"
      ).length;


   /* =========================================
   COMMISSION VALUES
========================================= */

const commissions =
  await Commission.find({
    agentId: agent._id,
  })
  .sort({
    createdAt: -1,
  });

const totalEarnings =
  commissions
    .filter(
      (commission) =>
        commission.status === "paid"
    )
    .reduce(
      (total, commission) =>
        total +
        Number(
          commission.commissionAmount || 0
        ),
      0
    );

const pendingCommission =
  commissions
    .filter(
      (commission) =>
        commission.status === "pending" ||
        commission.status === "approved"
    )
    .reduce(
      (total, commission) =>
        total +
        Number(
          commission.commissionAmount || 0
        ),
      0
    );


    /* =========================================
       RECENT STORES
    ========================================= */

    const recentStores =
      referredStores
        .slice(0, 5)
        .map((store) => ({
          id: store._id,
          storeName: store.storeName,
          businessType:
            store.businessType || null,
          plan: store.plan,
          subscriptionStatus:
            store.subscriptionStatus,
          subscriptionExpiry:
            store.subscriptionExpiry,
          createdAt:
            store.createdAt,
        }));


    /* =========================================
       RESPONSE
    ========================================= */

    return res.status(200).json({

      success: true,

      dashboard: {

        referredStoresCount,

        premiumStoresCount,

        totalEarnings,

        pendingCommission,

        referralCode:
          agent.referralCode,

        recentStores,

        commissionHistory:
      commissions.map(
        (commission) => ({
          id:
            commission._id,

          sourceType:
            commission.sourceType,

          plan:
            commission.plan,

          paymentAmount:
            commission.paymentAmount,

          commissionAmount:
            commission.commissionAmount,

          status:
            commission.status,

          withholdingReason:
            commission.withholdingReason,

          paymentReference:
            commission.paymentReference,

          createdAt:
            commission.createdAt,

          paidAt:
            commission.paidAt,
        })
      ),
},

    });

  } catch (error) {

    console.error(
      "Get Agent dashboard error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to load Agent dashboard.",

    });

  }
};


module.exports = {
  getAgentDashboard,
};