import { Request, Response } from 'express';
import { getJwtTtlsMs, verifyAccessToken } from "../configs/jwt";
import { NotivoResponse } from '../models/response';
import { UserCredentialDTO, UserDTO } from '../models/user';
import { findUserById, findUserByUsername, toUserDTO } from "../repositories/user.repository";
import authService from "../services/auth.service";

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
      return res.status(400).json({ message: "Username and password are required", data: null });
    }
    const tokens = await authService.loginUser(username, password);
    const user = await findUserByUsername(username);
    if (!user) {
    return res.status(401).json({ message: "Invalid credentials", data: null });
    }
    setAuthCookies(res, tokens);
    return res.status(200).json({ message: "User logged in", data: user ? toUserDTO(user) : null });
  } catch (err: any) {
    if (err?.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials", data: null });
    }
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

const register = async (req: Request<{}, {}, UserCredentialDTO>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {
      const { username, password } = req.body;
      console.log(username, password);
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required", data: null });
    }
    const user = await authService.registerUser({ username, password });
    const tokens = await authService.loginUser(username, password);
    setAuthCookies(res, tokens);
    return res.status(201).json({ message: "User created", data: user });
  } catch (err: any) {
    if (err?.message === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "Username already taken", data: null });
    }
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

const refresh = async (req: Request<{}, {}, { refreshToken: string }>, res: Response<NotivoResponse<UserDTO | null>>) => {
  try {

    const cookieToken = (req as any).cookies?.refreshToken as string | undefined;
    if (!cookieToken) return res.status(400).json({ message: "Refresh token is required", data: null });
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
    if (err?.message === "INVALID_REFRESH") {
      return res.status(401).json({ message: "Invalid refresh token", data: null });
    }
    return res.status(500).json({ message: "Internal Server Error", data: null });
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
    if (err?.message === "INVALID_REFRESH") {
      return res.status(401).json({ message: "Invalid refresh token", data: null });
    }
    return res.status(500).json({ message: "Internal Server Error", data: null });
  }
};

export default { login, register, refresh, logout };