import * as bcrypt from "bcryptjs";
import { UserCreateDTO, UserDTO } from "../models/user";
import { createUser, findUserByUsername, toUserDTO } from "../repositories/user.repository";

export const registerUser = async (payload: UserCreateDTO): Promise<UserDTO> => {
  const existing = await findUserByUsername(payload.username);
  if (existing) {
    throw new Error("USERNAME_TAKEN");
  }
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const created = await createUser({ username: payload.username, passwordHash });
  return toUserDTO(created);
};


