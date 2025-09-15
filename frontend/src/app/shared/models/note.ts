import { LabelValue } from './utils';

export interface Note {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  sharedWith?: LabelValue[];
  tags?: LabelValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotePayload {
  title: string;
  body: string;
  sharedWith: string[];
  tags: string[];
}
