import { Request, Response } from 'express';
import { registerUser } from "../services/auth.service";

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
//   const user = await User.create({ username, password });
  res.json({ message: "Register successful" });
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

export default { login, register };