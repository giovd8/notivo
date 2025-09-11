import { Request, Response } from 'express';
import { loginUser, refreshTokens, registerUser } from "../services/auth.service";

const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const tokens = await loginUser(username, password);
    return res.json(tokens);
  } catch (err: any) {
    if (err?.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await registerUser({ username, password });
    return res.status(201).json(user);
  } catch (err: any) {
    if (err?.message === "USERNAME_TAKEN") {
      return res.status(409).json({ message: "Username already taken" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token is required" });
    const tokens = await refreshTokens(refreshToken);
    return res.json(tokens);
  } catch (err: any) {
    if (err?.message === "INVALID_REFRESH") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default { login, register, refresh };