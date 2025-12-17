import express from "express";
import {
  getAllPricingPlans,
  getPricingPlan,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
} from "../controllers/pricing.controller.js";
import { checkRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply middleware to check if user is an admin for all routes
router.use(checkRole("ADMIN"));

// Pricing plan routes
router.get("/", getAllPricingPlans);
router.get("/:planId", getPricingPlan);
router.post("/", createPricingPlan);
router.put("/:planId", updatePricingPlan);
router.delete("/:planId", deletePricingPlan);

export default router;