import { Router } from "express";
import controller from "../controllers/tag.controller";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.createMany);

export default router;


