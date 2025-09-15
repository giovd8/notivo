import { Request, Response } from 'express';
import { NotivoResponse } from '../models/response';
import { UserDTO } from '../models/user';
import { LabelValue } from '../models/utils';
import repo from '../repositories/user.repository';
import { ServerError } from '../utils/server-error';

const list = async (req: Request, res: Response<NotivoResponse<LabelValue[]>>) => {
  try {
    const requesterId = String(req.headers['x-user-id'] || '');
    if (!requesterId) throw new ServerError('Unauthorized', 401);
    const others = await repo.listUsersFromCache(requesterId);
    const labelValues = (others ?? []).map((u) => repo.toLabelValueFromCached(u));
    return res.status(200).json({ message: 'Users list', data: labelValues ?? [] });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const create = async (req: Request<{}, {}, { username: string }>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const { username } = req.body || {} as any;
    if (!username || typeof username !== 'string') {
      throw new ServerError("username required", 400);
    }
    const created = await repo.createUser(username);
    return res.status(201).json({ message: 'User created', data: repo.toUserDTO(created) });
  } catch (err: any) {
    if (err?.code === '23505') {
      throw new ServerError("Username already taken", 409);
    }
    throw new ServerError(err?.message, err?.status);
  }
};

const getById = async (req: Request<{ id: string }>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const { id } = req.params;
    const user = await repo.findUserById(id); 
    if (!user) throw new ServerError("Not Found", 404);
    return res.status(200).json({ message: 'User', data: repo.toUserDTO(user) });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const getByUsername = async (req: Request, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const username = (req.query.username as string) || '';
    if (!username) throw new ServerError("username required", 400);
    const user = await repo.findUserByUsername(username);
    if (!user) throw new ServerError("Not Found", 404);
    return res.status(200).json({ message: 'User', data: repo.toUserDTO(user) });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

export default {list, create, getById, getByUsername}


