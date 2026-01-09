import { Router, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { AuthenticatedRequest, UserRole } from "../types";
import prisma from "../lib/prisma";

const router = Router();

router.get("/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(400).json({ success: false });
  const m = await prisma.membership.findUnique({ where: { userId_tenantId: { userId: req.user!.userId, tenantId } } });
  res.json({ success: true, data: m });
});

router.get("/", authenticate, authorize(UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(400).json({ success: false });
  const m = await prisma.membership.findMany({ where: { tenantId } });
  res.json({ success: true, data: m });
});

router.get("/:id", authenticate, authorize(UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(400).json({ success: false });
  const m = await prisma.membership.findFirst({ where: { id: req.params.id, tenantId } });
  res.json({ success: true, data: m });
});

router.post("/", authenticate, authorize(UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(400).json({ success: false });
  const m = await prisma.membership.create({ data: { ...req.body, tenantId } });
  res.status(201).json({ success: true, data: m });
});

router.put("/:id", authenticate, authorize(UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) return res.status(400).json({ success: false });
  const m = await prisma.membership.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: m });
});

export default router;
