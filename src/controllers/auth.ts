import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { insert } from "../models/dbmethods";

const USER_COLLECTION = "users";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(); // default 10 rounds
    const hashedPw = await bcrypt.hash(password, salt);
    await insert(USER_COLLECTION, [
      {
        username,
        email,
        password: hashedPw,
      },
    ]);
    res.status(201).send("User succesfully created");
  } catch (error) {
    res.status(500).send("User registration failed");
  }
};

export const login = (req: Request, res: Response, next: NextFunction) => {};

export const logout = (req: Request, res: Response, next: NextFunction) => {};
