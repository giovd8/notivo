import { Router } from "express";
import controller from "../controllers/user.controller";

const router = Router();

router.get("/users", controller.list);
router.post("/users", controller.create);
router.get("/users/:id", controller.getById);
router.get("/users/search/by-username", controller.getByUsername);

export default router;


