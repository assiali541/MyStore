import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import couponsRouter from "./coupons";
import ordersRouter from "./orders";
import dashboardRouter from "./dashboard";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(settingsRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(couponsRouter);
router.use(ordersRouter);
router.use(dashboardRouter);
router.use(uploadRouter);

export default router;
