import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { addUser, loginUser, updateRole } from "../models/authMethods";
import { User } from "../models/authMethods";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { UserRole, USER_ROLES } from "../models/roleDefinitions";
import { getAuthenticatedUser } from "../utils/auth";
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
  try {
    const { username, email, password } = req.body;

    const salt = await bcrypt.genSalt(); // default 10 rounds
    const hashedPw = await bcrypt.hash(password, salt);
    const userData: User = {
      username,
      email,
      password: hashedPw,
      role: USER_ROLES.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await addUser(userData);

    if (result) {
      res.status(201).json({
        success: true,
        message: "User successfully created",
        user: {
          username: userData.username,
          email: userData.email,
          role: userData.role
        }
      });
    } else {
      throw createError.internal('Failed to create user', 'USER_CREATION_FAILED');
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { identifier, password, isEmailLogin } = req.body;

    const userInfo = await loginUser(identifier);
    if (userInfo === null) return invalidCredentialsHandler();

    const pwMatch = await bcrypt.compare(password, userInfo.password);
    if (!pwMatch) return invalidCredentialsHandler();

    const token = jwt.sign(
      {
        userId: String(userInfo._id),
        role: userInfo.role || USER_ROLES.user,
        username: userInfo.username,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" },
    );

    res.cookie(
      "token",
      token,
      {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    );

    res.status(200).json({
      success: true,
      user: {
        userId: userInfo._id,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role
      },
      token, // send token in response to API calls
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async ( // no throw error because nothing can throw an error
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: 'successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.userId;
    const role = req.body.role;
    const currentUser = getAuthenticatedUser(req);

    if (currentUser.userId === userId) {
      throw createError.forbidden(
        'Cannot modify your own role',
        'SELF_ROLE_CHANGE_DENIED'
      );
    }

    const result = await updateRole(userId, role);

    if (!result){
      throw createError.notFound(
        'User not found or role could not be updated',
        'USER_UPDATE_FAILED'
      );
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      userId,
      newRole: role,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = getAuthenticatedUser(req);

    res.json({
      success: true,
      user: {
        userId: user.userId,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};
