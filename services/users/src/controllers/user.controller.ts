import { Request, Response } from 'express';
import { NotivoResponse } from '../models/response';
import { UserDTO } from '../models/user';
import repo from '../repositories/user.repository';

const list = async (_req: Request, res: Response<NotivoResponse<UserDTO[]>>) => {
  try {
    const users = await repo.listUsers();
    return res.status(200).json({ message: 'Users list', data: users.map(repo.toUserDTO) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', data: [] });
  }
};

const create = async (req: Request<{}, {}, { username: string }>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const { username } = req.body || {} as any;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'username required', data: null });
    }
    const created = await repo.createUser(username);
    return res.status(201).json({ message: 'User created', data: repo.toUserDTO(created) });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ message: 'Username already taken', data: null });
    }
    return res.status(500).json({ message: 'Internal Server Error', data: null });
  }
};

const getById = async (req: Request<{ id: string }>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const { id } = req.params;
    const user = await repo.findUserById(id);
    if (!user) return res.status(404).json({ message: 'Not Found', data: null });
    return res.status(200).json({ message: 'User', data: repo.toUserDTO(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', data: null });
  }
};

const getByUsername = async (req: Request, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const username = (req.query.username as string) || '';
    if (!username) return res.status(400).json({ message: 'username required', data: null });
    const user = await repo.findUserByUsername(username);
    if (!user) return res.status(404).json({ message: 'Not Found', data: null });
    return res.status(200).json({ message: 'User', data: repo.toUserDTO(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', data: null });
  }
};

export default {list, create, getById, getByUsername}


