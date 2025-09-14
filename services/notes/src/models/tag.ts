export interface TagEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export interface TagsRequestDTO {
  tags: string[];
}

export interface TagDTO {
  id: string;
  name: string;
  createdAt: Date;
}


