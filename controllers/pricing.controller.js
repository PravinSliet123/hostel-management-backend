import prisma from "../config/db.js";

// Get all pricing plans
export const getAllPricingPlans = async (req, res) => {
  try {
    const pricingPlans = await prisma.pricingPlan.findMany();
    res.status(200).json(pricingPlans);
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single pricing plan by ID
export const getPricingPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const pricingPlan = await prisma.pricingPlan.findUnique({
      where: { id: Number.parseInt(planId) },
    });

    if (!pricingPlan) {
      return res.status(404).json({ message: "Pricing plan not found" });
    }

    res.status(200).json(pricingPlan);
  } catch (error) {
    console.error("Error fetching pricing plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new pricing plan
export const createPricingPlan = async (req, res) => {
  try {
    const { name, semester, year, price, isExistingStudent } = req.body;

    if (!name || !semester || !year || !price) {
      return res.status(400).json({
        message: "Name, semester, year, and price are required fields",
      });
    }

    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        AND: [
          {
            semester: Number.parseInt(semester),
          },
          {
            year: Number.parseInt(year),
          },
          {
            isExistingStudent: isExistingStudent,
          },
        ],
      },
    });
    console.log("existingPlan: ", existingPlan);
    if (existingPlan) {
      return res.status(400).json({
        message:
          "A pricing plan with the same name or for the same semester and year already exists",
      });
    }

    const pricingPlan = await prisma.pricingPlan.create({
      data: {
        name,
        semester: Number.parseInt(semester),
        year: Number.parseInt(year),
        price: Number.parseFloat(price),
        isExistingStudent,
      },
    });

    res.status(201).json({
      message: "Pricing plan created successfully",
      pricingPlan,
    });
  } catch (error) {
    console.log('error: ', error);
    if (error.code == "P2002") {
      return res.status(500).json({
        message:
          "A pricing plan with the same name or for the same semester and year already exists ",
      });
    }
    console.error("Error creating pricing plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a pricing plan
export const updatePricingPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, semester, year, price, isExistingStudent } = req.body;

    if (!name && !semester && !year && !price) {
      return res.status(400).json({
        message: "At least one field (name, semester, year, price) is required",
      });
    }

    const existingPlanById = await prisma.pricingPlan.findFirst({
      where: {
        id: parseInt(planId),
      },
    });
    if (!existingPlanById) {
      return res.status(404).json({ message: "Pricing plan not found" });
    }
    console.log("existingPlanById: ", existingPlanById);

    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        AND: [
          {
            semester: Number.parseInt(semester),
          },
          {
            year: Number.parseInt(year),
          },
          {
            isExistingStudent: isExistingStudent,
          },
        ],
      },
    });

    // if (existingPlan) {
    //   return res.status(400).json({
    //     message:
    //       "A pricing plan with the same name or for the same semester and year already exists ",
    //   });
    // }

    const updatedPricingPlan = await prisma.pricingPlan.update({
      where: {
        id: Number.parseInt(planId),
        AND: [
          {
            semester: Number.parseInt(semester),
          },
          {
            year: Number.parseInt(year),
          },
          {
            isExistingStudent: isExistingStudent,
          },
        ],
      },
      data: {
        name,
        semester: semester ? Number.parseInt(semester) : undefined,
        year: year ? Number.parseInt(year) : undefined,
        price: price ? Number.parseFloat(price) : undefined,
        isExistingStudent: isExistingStudent,
      },
    });

    res.status(200).json({
      message: "Pricing plan updated successfully",
      pricingPlan: updatedPricingPlan,
    });
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    if (error.code == "P2002") {
      return res.status(500).json({
        message:
          "A pricing plan with the same name or for the same semester and year already exists ",
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a pricing plan
export const deletePricingPlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { id: Number.parseInt(planId) },
    });

    if (!existingPlan) {
      return res.status(404).json({ message: "Pricing plan not found" });
    }

    await prisma.pricingPlan.delete({
      where: { id: Number.parseInt(planId) },
    });

    res.status(200).json({ message: "Pricing plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
