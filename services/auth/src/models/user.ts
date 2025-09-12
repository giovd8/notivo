
export interface UserEntity {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface UserDTO {
  id: string;
  username: string;
  createdAt: Date;
}

export interface UserCredentialDTO {
  username: string;
  password: string;
}
