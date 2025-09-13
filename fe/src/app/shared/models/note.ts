export interface Note {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  sharedWith: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotePayload {
  title: string;
  body: string;
  sharedWith: string[];
  tags: string[];
}
