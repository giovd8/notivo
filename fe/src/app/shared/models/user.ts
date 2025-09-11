export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

export interface UserDTO {
  id: string;
  username: string;
  createdAt: Date;
}

export interface UserCreateDTO {
  username: string;
  password: string;
}
