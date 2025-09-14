import { Request, Response } from "express";
import { CreateNoteEntity, NoteDTO, UpdateNoteEntity } from "../models/note";
import { NotivoResponse } from "../models/response";
import noteRepository from "../repositories/note.repository";
import { ServerError } from "../utils/server-error";

interface TestNoteInput {
  id: string;
  title: string;
  body: string;
  ownerId: string; // username
  sharedWith: string[]; // usernames
  tags: string[]; // tag names
  createdAt: string;
  updatedAt: string;
}

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
    const search = String((req.query?.search ?? "")).trim();
    const tagsParam = String(req.query?.tags ?? "").trim();
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const hasFilters = (search?.length ?? 0) > 0 || (tags.length > 0);
    const notes = hasFilters
      ? await noteRepository.searchNotes(userId, search, tags)
      : await noteRepository.listNotes(userId);
    return res.status(200).json({ message: "Notes fetched", data: notes ?? [] });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const updateNote = async (
  req: Request<{ id: string }, {}, UpdateNoteEntity>,
  res: Response<NotivoResponse<NoteDTO | null>>
) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) throw new ServerError("Unauthorized", 401)
    const { id } = req.params;
    if (!id) throw new ServerError("Note ID is required", 400)
    const { title, body, sharedWith, tags } = req.body || {};
    if (!title && !body && !Array.isArray(sharedWith) && !Array.isArray(tags))  throw new ServerError("Nothing to update", 400)
    const noteData: UpdateNoteEntity = { title, body, sharedWith, tags };
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

const createTestNotes = async (
  req: Request<{}, {}, TestNoteInput[]>,
  res: Response<NotivoResponse<NoteDTO[]>>
) => {
  try {
    const testNotes = req.body || [];
    if (!Array.isArray(testNotes) || testNotes.length === 0) {
      throw new ServerError("Test notes array is required", 400);
    }
    const notes = await noteRepository.createTestNotes(testNotes);
    return res.status(201).json({ message: "Test notes created", data: notes });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};


export default { createNote, listNotes, updateNote, deleteNote, createTestNotes };


