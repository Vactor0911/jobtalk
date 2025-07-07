import { Request, Response } from "express";
import { dbPool } from "../config/db";

export const getAllWorkspaces = async (req: Request, res: Response) => {
  const { userUuid } = req.query;

  try {
    const workspaces = await dbPool.query(``);
  }
};
