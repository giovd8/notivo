import { Request, Response } from "express";
import { CreateNoteDTO, ListFilter, NoteDTO, UpdateNoteDTO } from "../models/note";
import { NotivoResponse } from "../models/response";
import noteRepository from "../repositories/note.repository";

const createNote = async (
  req: Request<{}, {}, CreateNoteDTO>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const ownerId = String(req.headers["x-user-id"] || "");
    const { title, body } = req.body || {};
    if (!ownerId) return res.status(401).json({ message: "Unauthorized", data: null });
    if (!title || !body) return res.status(400).json({ message: "Title and body are required", data: null });
    const note = await noteRepository.createNote(ownerId, { title, body });
    return res.status(201).json({ message: "Note created", data: note });
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

const listNotes = async (
  req: Request<{}, {}, {}, { filter?: ListFilter }>,
  res: Response<NotivoResponse<NoteDTO[]>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized", data: [] });
    const filter: ListFilter = (req.query.filter as ListFilter) || "all";
    const notes = await noteRepository.listNotes(userId, filter);
    return res.status(200).json({ message: "Notes fetched", data: notes });
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: [] });
  }
};

const updateNote = async (
  req: Request<{ id: string }, {}, UpdateNoteDTO>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) return res.status(401).json({ message: "Unauthorized", data: null });
    const { id } = req.params;
    const updated = await noteRepository.updateNote(userId, id, req.body || {});
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
    const ok = await noteRepository.deleteNote(userId, id);
    if (!ok) return res.status(404).json({ message: "Note not found", data: null });
    return res.status(204).send();
  } catch (_err) {
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

export default { createNote, listNotes, updateNote, deleteNote };


