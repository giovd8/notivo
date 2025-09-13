import { Request, Response } from "express";
import { CreateNoteEntity, NoteDTO } from "../models/note";
import { NotivoResponse } from "../models/response";
import noteRepository from "../repositories/note.repository";

const createNote = async (
  req: Request<{}, {}, CreateNoteEntity>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const ownerId = String(req.headers["x-user-id"] || "");
    const { title, body, sharedWith, tags } = req.body || {};
    if (!ownerId) return res.status(401).json({ message: "Unauthorized", data: null });
    if (!title || !body) return res.status(400).json({ message: "Title and body are required", data: null });
    const note = await noteRepository.createNote(ownerId,{ title, body, sharedWith, tags } );
    return res.status(201).json({ message: "Note created", data: note });
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

const listNotes = async (
  req: Request,
  res: Response<NotivoResponse<NoteDTO[]>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized", data: [] });
    const notes = await noteRepository.listNotes(userId);
    return res.status(200).json({ message: "Notes fetched", data: notes });
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: [] });
  }
};

const updateNote = async (
  req: Request<{ id: string }, {}, CreateNoteEntity>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized", data: null });
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Note ID is required", data: null });
    const { title, body, sharedWith, tags } = req.body || {};
    if (!title || !body) return res.status(400).json({ message: "Title and body are required", data: null });
    const noteData: CreateNoteEntity = { title, body, sharedWith, tags };
    const updated = await noteRepository.updateNote(userId, id, noteData);
    if (!updated) return res.status(404).json({ message: "Note not found", data: null });
    return res.status(200).json({ message: "Note updated", data: updated });
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

const deleteNote = async (
  req: Request<{ id: string }>,
  res: Response<NotivoResponse<null>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized", data: null });
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Note ID is required", data: null });
    const ok = await noteRepository.deleteNote(userId, id);
    if (!ok) return res.status(404).json({ message: "Note not found", data: null });
    return res.status(204).send();
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

export default { createNote, listNotes, updateNote, deleteNote };


