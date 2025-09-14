export interface NoteEntity {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteEntity {
  title: string;
  body: string;
  sharedWith: string[];
  tags: string[];
}

export interface UpdateNoteEntity {
  title?: string;
  body?: string;
  sharedWith?: string[];
  tags?: string[];
}


export type ListFilter = "all" | "shared";

export interface NoteDTO {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  sharedWith: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}


