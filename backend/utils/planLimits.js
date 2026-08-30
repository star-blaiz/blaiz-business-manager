const PLAN_LIMITS = {
  free: {
    products: 5,
    sales: 5,
    customers: 5,
    workers: 1,
  },

  premium: {
    products: Infinity,
    sales: Infinity,
    customers: Infinity,
    workers: Infinity,
  },
};

const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

module.exports = {
  PLAN_LIMITS,
  getPlanLimits,
};