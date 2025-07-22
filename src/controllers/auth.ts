import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { addUser, loginUser } from "../models/authMethods";
import { User } from "../models/authMethods";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"

dotenv.config();

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
      password: hashedPw,
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

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password } = req.body;
    const userInfo = await loginUser(username);
    if (userInfo === null) {
      res.status(401).send("Authentication failed");
    } else {
      const pwMatch = await bcrypt.compare(password, userInfo.password);
      if (!pwMatch) res.status(401).send("Authentication failed");
      const token = jwt.sign({
        userId: String(userInfo._id),
        // add user role from db
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "15m",
      }
    );
    res.status(200).send(token);
    }
  } catch (error) {
    res.status(500).send("Login Failed");
  }
};
