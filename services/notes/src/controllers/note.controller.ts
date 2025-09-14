import { Request, Response } from "express";
import { CreateNoteEntity, NoteDTO } from "../models/note";
import { NotivoResponse } from "../models/response";
import noteRepository from "../repositories/note.repository";
import { ServerError } from "../utils/server-error";

const createNote = async (
  req: Request<{}, {}, CreateNoteEntity>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const ownerId = String(req.headers["x-user-id"] || "");
    const { title, body, sharedWith, tags } = req.body || {};
    if (!ownerId) throw new ServerError("Unauthorized", 401)
    if (!title || !body) throw new ServerError("Title and body are required", 400)
    const note = await noteRepository.createNote(ownerId,{ title, body, sharedWith, tags } );
    return res.status(201).json({ message: "Note created", data: note });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const listNotes = async (
  req: Request,
  res: Response<NotivoResponse<NoteDTO[]>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) throw new ServerError("Unauthorized", 401)
    const notes = await noteRepository.listNotes(userId);
    return res.status(200).json({ message: "Notes fetched", data: notes });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const updateNote = async (
  req: Request<{ id: string }, {}, CreateNoteEntity>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) throw new ServerError("Unauthorized", 401)
    const { id } = req.params;
    if (!id) throw new ServerError("Note ID is required", 400)
    const { title, body, sharedWith, tags } = req.body || {};
    if (!title || !body)  throw new ServerError("Title and body are required", 400)
    const noteData: CreateNoteEntity = { title, body, sharedWith, tags };
    const updated = await noteRepository.updateNote(userId, id, noteData);
    if (!updated)  throw new ServerError("Note not found", 404)
    return res.status(200).json({ message: "Note updated", data: updated });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const deleteNote = async (
  req: Request<{ id: string }>,
  res: Response<NotivoResponse<null>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) throw new ServerError("Unauthorized", 401)
    const { id } = req.params;
    if (!id) throw new ServerError("Note ID is required", 400)
    const ok = await noteRepository.deleteNote(userId, id);
    if (!ok) throw new ServerError("Note not found", 404)
    return res.status(204).json({ message: "Note deleted", data: null});
  } catch (err: any) {
     throw new ServerError(err?.message, err?.status);
  }
};

export default { createNote, listNotes, updateNote, deleteNote };


