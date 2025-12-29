import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/auth.service";

const router = Router();

// Validation rules
const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("firstName").trim().notEmpty().withMessage("First name required"),
  body("lastName").trim().notEmpty().withMessage("Last name required"),
  body("phone").optional().trim(),
  body("fipsasNumber").optional().trim(),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

// POST /api/auth/register
router.post(
  "/register",
  registerValidation,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const { email, password, firstName, lastName, phone, fipsasNumber } =
        req.body;

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
        fipsasNumber,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      if (message === "User already exists") {
        return res.status(409).json({
          success: false,
          message,
        });
      }

      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// POST /api/auth/login
router.post("/login", loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";

    if (message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (message === "Account is deactivated") {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: "Token refreshed",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Token refresh failed";

    res.status(401).json({
      success: false,
      message,
    });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await AuthService.revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
});

export default router;
