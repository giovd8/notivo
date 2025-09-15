import { Router } from "express";
import controller from "../controllers/note.controller";

const router = Router();

router.get("/", controller.listNotes);
router.post("/", controller.createNote);
router.put("/:id", controller.updateNote);
router.delete("/:id", controller.deleteNote);
router.post("/test-notes", controller.createTestNotes);

export default router;