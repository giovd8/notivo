export interface NoteEntity {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteDTO {
  title: string;
  body: string;
}

export interface UpdateNoteDTO {
  title?: string;
  body?: string;
}

export type ListFilter = "all" | "shared";

export interface NoteDTO {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}


