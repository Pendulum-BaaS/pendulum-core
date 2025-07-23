import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
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
      return res.status(401).send("Authentication failed");
    } else {
      const pwMatch = await bcrypt.compare(password, userInfo.password);
      if (!pwMatch) {
        return res.status(401).send("Authentication failed");
      }
      const token = jwt.sign({
        userId: String(userInfo._id),
        // add user role from db
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "24h",
      }
    );
    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.status(200).send({ userId: userInfo._id });
    }
  } catch (error) {
    res.status(500).send("Login Failed");
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("token");
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send("Logout Failed");
  }
};
