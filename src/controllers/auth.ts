import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { addUser, loginUser } from "../models/authMethods";
import { User } from "../models/authMethods";
import { createError } from "../middleware/errorHandler";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"

dotenv.config();

const invalidCredentialsHandler = () => {
  throw createError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { username, email, password } = req.body;

  const salt = await bcrypt.genSalt(); // default 10 rounds
  const hashedPw = await bcrypt.hash(password, salt);
  const userData: User = {
    username,
    email,
    password: hashedPw,
  };
  const result = await addUser(userData);
  if (result) {
    res.status(201).send("User successfully created");
  } else {
    throw createError.internal('Failed to create user', 'USER_CREATION_FAILED');
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
    const { username, password } = req.body;

    const userInfo = await loginUser(username);
    if (userInfo === null) return invalidCredentialsHandler();

    const pwMatch = await bcrypt.compare(password, userInfo.password);
    if (!pwMatch) return invalidCredentialsHandler();

    const token = jwt.sign({
      userId: String(userInfo._id),
      // add user role from db
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "24h",
    });

  res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
  res.status(200).send({ userId: userInfo._id });
}

export const logout = async ( // no throw error because nothing can throw an error
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.clearCookie("token");
  res.sendStatus(200);
};
