import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { addUser } from "../models/authMethods";
import { User } from "../models/authMethods";}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(); // default 10 rounds
    const hashedPw = await bcrypt.hash(password, salt);
		const userData: User = {
			username,
			email,
			password: hashedPw
		};
    const result = await addUser(userData);
    if (result) {
    	res.status(201).send("User succesfully created");
    } else {
			throw new Error();
    }
  } catch (error) {
    res.status(500).send("User registration failed");
  }
};

export const login = (req: Request, res: Response, next: NextFunction) => {};

export const logout = (req: Request, res: Response, next: NextFunction) => {};
