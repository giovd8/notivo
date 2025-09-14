import { Request, Response } from 'express';
import { getJwtTtlsMs, verifyAccessToken } from "../configs/jwt";
import { NotivoResponse } from '../models/response';
import { UserCredentialDTO, UserDTO } from '../models/user';
import { findUserById, findUserByUsername, toUserDTO } from "../repositories/user.repository";
import authService from "../services/auth.service";
import { ServerError } from "../utils/server-error";

const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true as const,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    path: '/',
  };
  const { accessTtlMs, refreshTtlMs } = getJwtTtlsMs();
  res.cookie('accessToken', tokens.accessToken, { ...base, maxAge: accessTtlMs || 15 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...base, maxAge: refreshTtlMs || 7 * 24 * 60 * 60 * 1000 });
};

const login = async (req: Request<{}, {}, UserCredentialDTO>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
          throw new ServerError("Username and password are required", 400);
    }
    const tokens = await authService.loginUser(username, password);
    const user = await findUserByUsername(username);
    if (!user) {
      throw new ServerError("Invalid credentials", 401);
    }
    setAuthCookies(res, tokens);
    return res.status(200).json({ message: "User logged in", data: user ? toUserDTO(user) : null });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const register = async (req: Request<{}, {}, UserCredentialDTO>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
      const { username, password } = req.body;
    if (!username || !password) {
      throw new ServerError("Username and password are required", 400);
    }
    const user = await authService.registerUser({ username, password });
    const tokens = await authService.loginUser(username, password);
    setAuthCookies(res, tokens);
    return res.status(201).json({ message: "User created", data: user });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const refresh = async (req: Request<{}, {}, { refreshToken: string }>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {

    const cookieToken = (req as any).cookies?.refreshToken as string | undefined;
    if (!cookieToken) throw new ServerError("Refresh token is required", 400);
      const tokens = await authService.refreshTokens(cookieToken);

    setAuthCookies(res, tokens);
    let dto: UserDTO | null = null;
    try {
      const decoded: any = verifyAccessToken(tokens.accessToken);
      const sub = decoded?.sub as string | undefined;
      if (sub) {
        const user = await findUserById(sub);
        dto = user ? toUserDTO(user) : null;
      }
    } catch {}
    return res.status(200).json({ message: "Tokens refreshed", data: dto });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const logout = async (req: Request<{}, {}, { refreshToken?: string }>, res: Response<NotivoResponse<null>>) => {
  try {
    const cookieToken = (req as any).cookies?.refreshToken as string | undefined;
    if (!cookieToken) return res.status(400).json({ message: "Refresh token is required", data: null });
    await authService.logoutUser(cookieToken);
    const isProd = process.env.NODE_ENV === 'production';
    const base = {
      httpOnly: true as const,
      secure: isProd,
      sameSite: isProd ? ('none' as const) : ('lax' as const),
      path: '/',
    };
    res.clearCookie('accessToken', base);
    res.clearCookie('refreshToken', base);
    return res.status(204).send();
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

const registerTestUsers = async (req: Request, res: Response<NotivoResponse<UserDTO[]>>) => {
  try {
    const users = req.body.users;
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ message: "Users array is required", data: [] });
    }
    for(const user of users) {
      await authService.registerUser({ username: user.username, password: user.password });
    }
    return res.status(200).json({ message: "Test users registered", data: users });
  } catch (err: any) {
    throw new ServerError(err?.message, err?.status);
  }
};

export default { login, register, refresh, logout, registerTestUsers };