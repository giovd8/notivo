import { Router } from "express";
import controller from "../controllers/user.controller";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.get("/search/by-username", controller.getByUsername);

export default router;


