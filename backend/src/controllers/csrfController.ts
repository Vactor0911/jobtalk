import { Request, Response } from "express";

// CSRF 토큰 요청
export const csrfToken = (req: Request, res: Response): void => {
  try {
    const token = req.csrfToken();
    res.json({
      success: true,
      csrfToken: token,
    });
  } catch (err) {
    console.error("CSRF 토큰 생성 중 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "CSRF 토큰 생성 중 오류가 발생했습니다.",
    });
  }
};