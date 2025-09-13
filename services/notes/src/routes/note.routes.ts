import { Router } from "express";
import controller from "../controllers/note.controller";

const router = Router();

router.get("/notes", controller.listNotes); // ?filter=all|shared (default all)
router.post("/notes", controller.createNote);
router.put("/notes/:id", controller.updateNote);
router.delete("/notes/:id", controller.deleteNote);

export default router;