import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * CMS Routes - Public endpoints for landing page content
 * No authentication required
 */

/**
 * GET /api/cms/features
 * Returns all active features for a given locale
 */
router.get("/features", async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || "it";

    const features = await prisma.feature.findMany({
      where: {
        isActive: true,
        locale: locale
      },
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        icon: true,
        title: true,
        description: true,
        badge: true,
        sortOrder: true
      }
    });

    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch features"
    });
  }
});

/**
 * GET /api/cms/pricing-plans
 * Returns all active pricing plans with their features
 */
router.get("/pricing-plans", async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || "it";

    const plans = await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
        locale: locale
      },
      orderBy: {
        sortOrder: "asc"
      },
      include: {
        features: {
          orderBy: {
            sortOrder: "asc"
          },
          select: {
            id: true,
            text: true,
            included: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing plans"
    });
  }
});

/**
 * GET /api/cms/faqs
 * Returns all active FAQs for a given category and locale
 */
router.get("/faqs", async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || "it";
    const category = (req.query.category as string) || "pricing";

    const faqs = await prisma.faq.findMany({
      where: {
        isActive: true,
        locale: locale,
        category: category
      },
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        question: true,
        answer: true,
        link: true,
        linkText: true
      }
    });

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQs"
    });
  }
});

/**
 * GET /api/cms/disciplines
 * Returns all active disciplines for a given locale
 */
router.get("/disciplines", async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || "it";
    const category = req.query.category as string;

    const where: any = {
      isActive: true,
      locale: locale
    };

    if (category) {
      where.category = category;
    }

    const disciplines = await prisma.disciplineInfo.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" }
      ],
      select: {
        id: true,
        code: true,
        name: true,
        subtitle: true,
        description: true,
        icon: true,
        category: true
      }
    });

    // Group by category for easier frontend consumption
    const grouped = disciplines.reduce((acc: any, discipline) => {
      if (!acc[discipline.category]) {
        acc[discipline.category] = [];
      }
      acc[discipline.category].push(discipline);
      return acc;
    }, {});

    res.json({
      success: true,
      data: disciplines,
      grouped: grouped
    });
  } catch (error) {
    console.error("Error fetching disciplines:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch disciplines"
    });
  }
});

/**
 * GET /api/cms/landing
 * Returns all landing page content in a single request (optimized)
 */
router.get("/landing", async (req: Request, res: Response) => {
  try {
    const locale = (req.query.locale as string) || "it";

    const [features, plans, faqs, disciplines] = await Promise.all([
      prisma.feature.findMany({
        where: { isActive: true, locale },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          icon: true,
          title: true,
          description: true,
          badge: true
        }
      }),
      prisma.pricingPlan.findMany({
        where: { isActive: true, locale },
        orderBy: { sortOrder: "asc" },
        include: {
          features: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, text: true, included: true }
          }
        }
      }),
      prisma.faq.findMany({
        where: { isActive: true, locale, category: "pricing" },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          question: true,
          answer: true,
          link: true,
          linkText: true
        }
      }),
      prisma.disciplineInfo.findMany({
        where: { isActive: true, locale },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          subtitle: true,
          description: true,
          icon: true,
          category: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        features,
        pricingPlans: plans,
        faqs,
        disciplines
      }
    });
  } catch (error) {
    console.error("Error fetching landing content:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch landing content"
    });
  }
});

export default router;
