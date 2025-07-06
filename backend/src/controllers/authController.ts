import { Request, Response } from "express";
import { dbPool } from "../config/db";

import bcrypt from "bcrypt"; // 비밀번호 암호화 최신버전 express 에서 가지고 있다함
import nodemailer from "nodemailer"; // 이메일 전송 라이브러리
import validator from "validator"; // 유효성 검사 라이브러리
import jwt from "jsonwebtoken"; // JWT 토큰 생성 및 검증 라이브러리
import multer from "multer"; // 파일 업로드를 위한 라이브러리
import fs from "fs"; // 파일 시스템 모듈
import path from "path"; // 경로 조작을 위한 모듈

const allowedSymbolsForPassword = /^[a-zA-Z0-9!@#$%^&*?]*$/; // 허용된 문자만 포함하는지 확인

// 사용자 회원가입
export const register = async (req: Request, res: Response) => {
  const { email, password, name, terms, certificates } = req.body;
  const connection = await dbPool.getConnection(); // 커넥션 획득

  try {
    await connection.beginTransaction(); // 트랜잭션 시작

    // Step 1: 이메일 중복 확인
    const rows_email = await connection.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );

    if (rows_email.length > 0) {
      await connection.rollback(); // 롤백
      res.status(400).json({
        success: false,
        message: "이미 가입된 이메일입니다.",
      });
      return;
    }

    // 비밀번호 검증 추가 (필요시 주석 해제)
    // if (
    //   !validator.isStrongPassword(password, {
    //     minLength: 8,
    //     minNumbers: 1,
    //     minSymbols: 1,
    //     minUppercase: 0,
    //   }) ||
    //   !allowedSymbolsForPassword.test(password) // 허용된 문자만 포함하는지 확인
    // ) {
    //   res.status(400).json({
    //     success: false,
    //     message:
    //       "비밀번호는 8자리 이상, 영문, 숫자, 특수문자(!@#$%^&*?)를 포함해야 합니다.",
    //   });
    //   return;
    // }

    // Step 2: 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: 사용자 저장 - 추가 필드 포함
    await connection.query(
      `INSERT INTO user (email, password, name, terms, certificates) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        name,
        JSON.stringify(terms || { privacy: true }),
        certificates || null, // 자격증 추가
      ]
    );

    await connection.commit(); // 트랜잭션 커밋

    // Step 4: 성공 응답
    res.status(201).json({
      success: true,
      message: "사용자가 성공적으로 등록되었습니다",
    });
  } catch (err: any) {
    await connection.rollback(); // 오류 시 롤백
    console.error("서버 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "서버 오류 발생",
      error: err.message,
    });
  } finally {
    connection.release(); // 커넥션 반환
  }
};

// 사용자 로그인
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Step 0: 탈퇴된 계정인지 확인
    const rows_check = await dbPool.query(
      "SELECT user_id, state FROM user WHERE email = ?",
      [email]
    );

    if (rows_check.length > 0 && rows_check[0].state === "inactive") {
      // 탈퇴된 계정인 경우
      res.status(400).json({
        success: false,
        message: "탈퇴된 계정입니다. 관리자에게 문의해주세요.",
      });
      return;
    }

    // Step 1: ID로 사용자 조회
    const rows = await dbPool.query(
      "SELECT * FROM user WHERE email = ? AND state = 'active'",
      [email]
    );

    if (rows.length === 0) {
      // 사용자가 없는 경우
      res.status(400).json({
        success: false,
        message: "사용자를 찾을 수 없습니다. 회원가입 후 이용해주세요.",
      });
      return;
    }

    const user = rows[0];

    // Step 2: 암호화된 비밀번호 비교
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다. 다시 입력해주세요.",
      });
      return;
    }

    // Step 3: Access Token 발급
    const accessToken = jwt.sign(
      {
        userId: user.user_id,
        userUuid: user.user_uuid,
        name: user.name,
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "30m" }
    );

    // Step 4: Refresh Token 발급
    const refreshToken = jwt.sign(
      {
        userId: user.user_id,
        userUuid: user.user_uuid,
        name: user.name,
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Step 5: Refresh Token 저장 (DB)
    await dbPool.query("UPDATE user SET refresh_token = ? WHERE email = ?", [
      refreshToken,
      email,
    ]);

    // Step 6: 쿠키에 Refresh Token 저장
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // Step 7: 응답 반환
    res.status(200).json({
      success: true,
      message: "로그인 성공",
      name: user.name,
      userUuid: user.user_uuid,
      userId: user.user_id,
      accessToken,
    });
    return;
  } catch (err: any) {
    console.error("서버 오류 발생:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "서버 오류 발생",
      error: err.message,
    });
    return;
  }
};

// 사용자 로그아웃
export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies; // 쿠키에서 Refresh Token 추출

  if (!refreshToken) {
    res.status(403).json({
      success: false,
      message: "Refresh Token이 필요합니다.",
    });
    return;
  }

  try {
    // DB에서 유효한 토큰인지 확인
    const rows = await dbPool.query(
      "SELECT * FROM user WHERE refresh_token = ?",
      [refreshToken]
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "유효하지 않은 Refresh Token입니다.",
      });
      return;
    }

    // DB에서 Refresh Token 제거
    await dbPool.query(
      "UPDATE user SET refresh_token = NULL WHERE refresh_token = ?",
      [refreshToken]
    );

    // 클라이언트에서 쿠키 삭제
    res.clearCookie("csrf-token"); // CSRF 토큰 쿠키 삭제
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "로그아웃이 성공적으로 완료되었습니다.",
    });
    return;
  } catch (err) {
    console.error("로그아웃 처리 중 서버 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "로그아웃 처리 중 오류가 발생했습니다.",
    });
    return;
  }
};

// 이메일 인증 코드 전송
export const sendVerifyEmail = async (req: Request, res: Response) => {
  const { email, purpose } = req.body; // purpose 변수 추가

  if (!email) {
    res
      .status(400)
      .json({ success: false, message: "이메일 주소가 필요합니다." });
    return;
  }
  if (!validator.isEmail(email)) {
    res
      .status(400)
      .json({ success: false, message: "유효한 이메일 주소를 입력해주세요." });
    return;
  }

  // purpose 유효성 검사 추가
  const validPurposes = ["register", "resetPassword"];
  if (!purpose || !validPurposes.includes(purpose)) {
    res.status(400).json({
      success: false,
      message: "유효한 목적을 지정해주세요. (register 또는 resetPassword)",
    });
    return;
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction(); // 트랜잭션 시작

    // 이메일 중복 확인 로직을 purpose에 따라 다르게 처리
    const existingUserRows = await connection.query(
      "SELECT email, state FROM user WHERE email = ?",
      [email]
    );

    if (purpose === "register") {
      // 회원가입 목적인 경우
      if (existingUserRows.length > 0) {
        const existingUser = existingUserRows[0];

        if (existingUser.state === "inactive") {
          res.status(400).json({
            success: false,
            message: "탈퇴된 계정입니다. 관리자에게 문의해주세요.",
          });
          return;
        }

        // 이미 가입된 이메일인 경우
        res.status(400).json({
          success: false,
          message: "이미 가입된 이메일입니다. 로그인해 주세요.",
        });
        return;
      }
    } else if (purpose === "resetPassword") {
      // 비밀번호 찾기 목적인 경우
      if (existingUserRows.length === 0) {
        res.status(400).json({
          success: false,
          message: "등록되지 않은 이메일입니다. 회원가입을 진행해주세요.",
        });
        return;
      }

      const existingUser = existingUserRows[0];
      if (existingUser.state === "inactive") {
        res.status(400).json({
          success: false,
          message: "탈퇴된 계정입니다. 관리자에게 문의해주세요.",
        });
        return;
      }
    }

    // 랜덤 인증 코드 생성
    const generateRandomCode = (n: number): string => {
      let str = "";
      for (let i = 0; i < n; i++) {
        str += Math.floor(Math.random() * 10);
      }
      return str;
    };
    const verificationCode = generateRandomCode(6);

    // 인증 코드 저장 (유효 기간 5분) - purpose도 함께 저장
    const expiresAt = new Date(new Date().getTime() + 5 * 60 * 1000); // 정확히 5분 후
    await connection.query(
      "INSERT INTO email_verification (email, verification_code, expires_at, purpose) VALUES (?, ?, ?, ?)",
      [email, verificationCode, expiresAt, purpose]
    );

    // 이메일 전송 - purpose에 따라 다른 제목과 내용
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    // purpose에 따른 이메일 내용 변경
    const getEmailContent = (purpose: string, verificationCode: string) => {
      if (purpose === "resetPassword") {
        return {
          subject: "[JobTalk] 비밀번호 재설정 인증번호",
          title: "JobTalk 비밀번호 재설정",
          description: "JobTalk 비밀번호 재설정을 위한 인증번호입니다.",
        };
      } else {
        return {
          subject: "[JobTalk] 회원가입 인증번호",
          title: "JobTalk 회원가입 인증번호",
          description: "JobTalk 회원가입을 위한 이메일 인증번호입니다.",
        };
      }
    };

    const emailContent = getEmailContent(purpose, verificationCode);

    const mailOptions = {
      from: `"JobTalk" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject: emailContent.subject,
      html: `
      <div style="font-family:'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif; max-width:500px; margin:0 auto;">
        <!-- 헤더 -->
        <div style="background-color:#ff8551; color:white; padding:20px; text-align:left;">
          <h1 style="margin:0; font-size:24px; font-weight:bold;">${emailContent.title}</h1>
        </div>
        
        <!-- 본문 -->
        <div style="padding:30px 20px; background-color:white; border:1px solid #e1e1e1; border-top:none;">
          <p style="font-size:16px; color:#404040; margin-bottom:30px;">
            ${emailContent.description}
          </p>
          
          <!-- 인증번호 박스 -->
          <div style="background-color:#faf0e4; padding:20px; text-align:center; margin-bottom:30px; border-radius:4px;">
            <h2 style="font-size:38px; letter-spacing:10px; color:#ff8551; margin:0; font-weight:bold;">${verificationCode}</h2>
          </div>
          
          <!-- 안내문구 -->
          <p style="font-size:14px; color:#787878; margin-top:30px; border-top:1px solid #eee; padding-top:20px;">
            본 메일은 발신전용입니다.<br>
            인증번호는 5분간만 유효합니다.
          </p>
          <p style="font-size:13px; color:#787878; margin-top:15px;">
            Copyright © JobTalk. All rights reserved.
          </p>
        </div>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await connection.commit(); // 트랜잭션 커밋

    // purpose에 따른 다른 응답 메시지
    const responseMessage =
      purpose === "resetPassword"
        ? "비밀번호 재설정을 위한 인증번호가 이메일로 발송되었습니다."
        : "회원가입을 위한 인증번호가 이메일로 발송되었습니다.";

    res.status(200).json({
      success: true,
      message: responseMessage,
    });
  } catch (err) {
    if (connection) await connection.rollback(); // 트랜잭션 롤백
    console.error("Error sending email verification code:", err);
    res
      .status(500)
      .json({ success: false, message: "메일 발송에 실패했습니다." });
  } finally {
    if (connection) connection.release();
  }
};

// 인증번호 검증
export const verifyEmailCode = async (req: Request, res: Response) => {
  const { email, code, purpose } = req.body; // purpose 추가

  if (!email) {
    res.status(400).json({ success: false, message: "이메일을 입력해주세요." });
    return;
  }
  if (!code) {
    res
      .status(400)
      .json({ success: false, message: "인증번호를 입력해주세요." });
    return;
  }
  if (!validator.isEmail(email)) {
    res
      .status(400)
      .json({ success: false, message: "유효한 이메일 주소를 입력해주세요." });
    return;
  }
  if (!validator.isNumeric(code, { no_symbols: true }) || code.length !== 6) {
    res
      .status(400)
      .json({ success: false, message: "인증 코드는 6자리 숫자입니다." });
    return;
  }

  // purpose 유효성 검사
  const validPurposes = ["register", "resetPassword"];
  if (!purpose || !validPurposes.includes(purpose)) {
    res.status(400).json({
      success: false,
      message: "유효한 목적을 지정해주세요. (register 또는 resetPassword)",
    });
    return;
  }

  try {
    // 인증 코드 검증 - purpose도 함께 확인
    const [record] = await dbPool.query(
      "SELECT verification_code, expires_at, purpose FROM email_verification WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1",
      [email, purpose]
    );

    if (!record) {
      res
        .status(400)
        .json({ success: false, message: "인증번호가 존재하지 않습니다." });
      return;
    }

    const {
      verification_code: storedCode,
      expires_at: expiresAt,
      purpose: storedPurpose,
    } = record;

    // purpose 일치 확인
    if (storedPurpose !== purpose) {
      res
        .status(400)
        .json({ success: false, message: "인증 목적이 일치하지 않습니다." });
      return;
    }

    if (
      new Date(new Date().getTime() + 9 * 60 * 60 * 1000) >
      new Date(new Date(expiresAt).getTime() + 9 * 60 * 60 * 1000)
    ) {
      res
        .status(400)
        .json({ success: false, message: "인증번호가 만료되었습니다." });
      return;
    }

    if (storedCode !== code) {
      res
        .status(400)
        .json({ success: false, message: "인증번호가 일치하지 않습니다." });
      return;
    }

    // 인증 성공
    await dbPool.query(
      "DELETE FROM email_verification WHERE email = ? AND purpose = ?",
      [email, purpose]
    ); // 검증 후 해당 purpose의 데이터만 삭제

    const responseMessage =
      purpose === "resetPassword"
        ? "비밀번호 재설정 인증이 완료되었습니다."
        : "이메일 인증이 완료되었습니다.";

    res.status(200).json({
      success: true,
      message: responseMessage,
      purpose: purpose, // 프론트엔드에서 다음 단계 결정을 위해 purpose 반환
    });
  } catch (err) {
    console.error("Error verifying code:", err);
    res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// 엑세스 토큰 재발급
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies; // 쿠키에서 Refresh Token 추출

  if (!refreshToken) {
    res.status(403).json({
      success: false,
      message: "Refresh Token이 필요합니다.",
    });
    return;
  }

  try {
    const rows = await dbPool.query(
      "SELECT * FROM user WHERE refresh_token = ?",
      [refreshToken]
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "유효하지 않은 Refresh Token입니다.",
      });
      return;
    }

    // Refresh Token 유효성 검증 및 Access Token 재발급
    try {
      const decoded: any = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      );
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          userUuid: decoded.userUuid, // 사용자 UUID
          name: decoded.name,
        },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "30m" } // Access Token 만료 시간
      );

      res.status(200).json({
        success: true,
        message: "Access Token이 갱신되었습니다.",
        accessToken: newAccessToken,
        userId: decoded.userId,
        name: decoded.name,
      });
    } catch (err) {
      // Refresh Token 만료 시 DB에서 삭제
      await dbPool.query(
        "UPDATE user SET refresh_token = NULL WHERE refresh_token = ?",
        [refreshToken]
      );
      res.status(403).json({
        success: false,
        message: "Refresh Token이 만료되었습니다.",
      });
    }
  } catch (err) {
    console.error("Token Refresh 처리 중 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "서버 오류로 인해 토큰 갱신에 실패했습니다.",
    });
  }
};

// 사용자 정보 조회
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    // req.user는 authenticate 미들웨어에서 설정된 값
    const user = req.user as { userId: number };

    if (!user || !user.userId) {
      res.status(401).json({
        success: false,
        message: "인증 정보가 유효하지 않습니다.",
      });
      return;
    }

    // DB에서 사용자 정보 조회
    const rows = await dbPool.query(
      `SELECT user_id, email, name, profile_image, user_uuid, certificates 
       FROM user WHERE user_id = ? AND state = 'active'`,
      [user.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "사용자 정보를 찾을 수 없습니다.",
      });
      return;
    }

    const userInfo = rows[0];

    res.status(200).json({
      success: true,
      data: {
        userId: userInfo.user_id,
        email: userInfo.email,
        name: userInfo.name,
        userUuid: userInfo.user_uuid,
        profileImage: userInfo.profile_image || null, // 프로필 이미지 경로 추가
        job: userInfo.job, // 직업 정보 추가
        experience: userInfo.experience, // 경력 정보 추가
        certificates: userInfo.certificates, // 자격증 정보 추가
      },
    });
  } catch (err) {
    console.error("사용자 정보 조회 중 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "사용자 정보 조회 중 오류가 발생했습니다.",
    });
  }
};

// 닉네임 변경
export const updateNickname = async (req: Request, res: Response) => {
  const { nickname } = req.body;
  const user = req.user as { userId: number };

  if (!nickname || nickname.trim() === "") {
    res.status(400).json({
      success: false,
      message: "닉네임은 필수 입력 항목입니다.",
    });
    return;
  }

  try {
    await dbPool.query(
      "UPDATE user SET name = ? WHERE user_id = ? AND state = 'active'",
      [nickname, user.userId]
    );

    res.status(200).json({
      success: true,
      message: "닉네임이 성공적으로 변경되었습니다.",
      data: {
        nickname,
      },
    });
  } catch (err) {
    console.error("닉네임 변경 중 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "닉네임 변경 중 오류가 발생했습니다.",
    });
  }
};

// 비밀번호 변경
export const updatePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const user = req.user as { userId: number };
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // 필수 입력 검증
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: "모든 비밀번호 필드를 입력해주세요.",
      });
      return;
    }

    // 새 비밀번호 일치 여부 확인
    if (newPassword !== confirmNewPassword) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: "새 비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    // // 비밀번호 복잡성 검증
    // const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*?]).{8,}$/;
    // if (!passwordRegex.test(newPassword)) {
    //   res.status(400).json({
    //     success: false,
    //     message: "비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.",
    //   });
    //   return;
    // }

    // 현재 사용자의 비밀번호 조회
    const rows = await connection.query(
      "SELECT password FROM user WHERE user_id = ? AND state = 'active'",
      [user.userId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
      return;
    }

    const userInfo = rows[0];

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userInfo.password
    );

    if (!isPasswordValid) {
      await connection.rollback();
      res.status(401).json({
        success: false,
        message: "현재 비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    // 현재 비밀번호와 새 비밀번호가 동일한지 확인
    if (currentPassword === newPassword) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
      });
      return;
    }

    // 새 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await connection.query("UPDATE user SET password = ? WHERE user_id = ?", [
      hashedPassword,
      user.userId,
    ]);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다.",
    });
  } catch (err) {
    await connection.rollback();
    console.error("비밀번호 변경 중 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "비밀번호 변경 중 오류가 발생했습니다.",
    });
  } finally {
    connection.release();
  }
};

// 계정 탈퇴
export const deleteAccount = async (req: Request, res: Response) => {
  const user = req.user as { userId: number; userUuid: string };
  const { password } = req.body;
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // 사용자 정보 조회
    const rows = await connection.query(
      "SELECT * FROM user WHERE user_id = ? AND state = 'active'",
      [user.userId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
      return;
    }

    const userInfo = rows[0];

    if (!password) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: "계정 탈퇴를 위해 비밀번호가 필요합니다.",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, userInfo.password);
    if (!isPasswordValid) {
      await connection.rollback();
      res.status(401).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    // 프로필 이미지 파일 삭제 로직 추가
    try {
      // 사용자의 프로필 이미지 정보 가져오기
      if (userInfo.profile_image) {
        // DB에 저장된 경로에서 파일명 추출
        const profileImagePath = path.join(
          __dirname,
          "../../",
          userInfo.profile_image.substring(1) // 앞의 '/' 제거
        );

        // 파일이 존재하는지 확인 후 삭제
        if (fs.existsSync(profileImagePath)) {
          fs.unlinkSync(profileImagePath);
        }

        // 모든 종류의 프로필 이미지 삭제 (확장자 상관없이)
        const profileDir = path.join(__dirname, "../../uploads/profiles");
        if (fs.existsSync(profileDir)) {
          const files = fs.readdirSync(profileDir);
          const userPrefix = user.userUuid;

          files.forEach((file) => {
            if (file.startsWith(userPrefix)) {
              const filePath = path.join(profileDir, file);
              fs.unlinkSync(filePath);
            }
          });
        }
      }
    } catch (error) {
      // 이미지 삭제 실패해도 계정 탈퇴는 계속 진행
      console.error("프로필 이미지 삭제 중 오류:", error);
    }

    // 사용자 계정 삭제
    await connection.query("DELETE from user WHERE user_id = ?", [user.userId]);

    await connection.commit();

    // 로그아웃 처리
    res.clearCookie("csrf-token");
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "계정이 성공적으로 탈퇴되었습니다.",
    });
  } catch (err) {
    await connection.rollback();
    console.error("계정 탈퇴 중 오류 발생:", err);
    res.status(500).json({
      success: false,
      message: "계정 탈퇴 중 오류가 발생했습니다.",
    });
  } finally {
    connection.release();
  }
};

// 프로필 이미지 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/profiles");

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const user = req.user as { userUuid: string };
    // MIME 타입에서 확장자 추출 (더 안전한 방식)
    let ext = "";
    switch (file.mimetype) {
      case "image/jpeg":
        ext = ".jpg";
        break;
      case "image/png":
        ext = ".png";
        break;
      case "image/gif":
        ext = ".gif";
        break;
      case "image/webp":
        ext = ".webp";
        break;
      default:
        ext = path.extname(file.originalname) || ".jpg"; // 기본값 제공
    }

    // 추후에 삭제 예정
    console.log(
      `파일 업로드: 타입=${file.mimetype}, 파일명=${file.originalname}, 사용할 확장자=${ext}`
    );

    const fileName = `${user.userUuid}${ext}`;
    cb(null, fileName);
  },
});

// 파일 필터
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 이미지 파일만 허용
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "지원되지 않는 파일 형식입니다. JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
  },
}).single("profileImage");

// 프로필 이미지 업로드
export const uploadProfileImage = async (req: Request, res: Response) => {
  const user = req.user as { userId: number; userUuid: string };

  upload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "파일 크기는 4MB를 초과할 수 없습니다.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "파일 업로드 중 오류가 발생했습니다.",
      });
    }

    // 파일이 없는 경우
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "업로드할 파일이 없습니다.",
      });
    }

    try {
      // 기존 프로필 이미지 조회
      const rows = await dbPool.query(
        "SELECT profile_image FROM user WHERE user_id = ?",
        [user.userId]
      );

      const oldProfileImage = rows[0]?.profile_image;

      // 새 이미지 저장 전에 먼저 기존 이미지들 삭제
      try {
        const profileDir = path.join(__dirname, "../../uploads/profiles");

        if (fs.existsSync(profileDir)) {
          const files = fs.readdirSync(profileDir);
          const userPrefix = user.userUuid;

          files.forEach((file) => {
            if (file.startsWith(userPrefix) && file !== req.file?.filename) {
              const filePath = path.join(profileDir, file);
              fs.unlinkSync(filePath);
            }
          });
        }

        // 1. DB에 저장된 이전 이미지 삭제 (추가 안전장치)
        if (oldProfileImage) {
          const oldImagePath = path.join(
            __dirname,
            "../../",
            oldProfileImage.substring(1)
          );

          // 새로 업로드된 파일과 다른 경우에만 삭제
          const newImagePath = `/uploads/profiles/${req.file.filename}`;
          if (oldProfileImage !== newImagePath && fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      } catch (error) {
        console.error("기존 프로필 이미지 삭제 중 오류:", error);
        // 이미지 삭제 실패해도 새 이미지 저장은 계속 진행
      }

      // 새 프로필 이미지 경로
      const profileImagePath = `/uploads/profiles/${req.file.filename}`;

      // DB에 프로필 이미지 경로 저장
      await dbPool.query(
        "UPDATE user SET profile_image = ? WHERE user_id = ?",
        [profileImagePath, user.userId]
      );

      res.status(200).json({
        success: true,
        message: "프로필 이미지가 성공적으로 업로드되었습니다.",
        data: {
          profileImage: profileImagePath,
        },
      });
    } catch (err) {
      console.error("프로필 이미지 업로드 중 오류 발생:", err);
      res.status(500).json({
        success: false,
        message: "프로필 이미지 저장 중 오류가 발생했습니다.",
      });
    }
  });
};

// 자격증 정보 업데이트
export const updateUserCertificates = async (req: Request, res: Response) => {
  try {
    const { certificates } = req.body;
    const userId = req.user?.userId;

    // 자격증 정보 업데이트 로직 - 컬럼명 수정
    await dbPool.query("UPDATE user SET certificates = ? WHERE user_id = ?", [
      certificates,
      userId,
    ]);

    res.status(200).json({
      success: true,
      message: "자격증 정보가 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("자격증 업데이트 오류:", error);
    res.status(500).json({
      success: false,
      message: "자격증 정보 업데이트에 실패했습니다.",
    });
  }
};

// 비밀번호 재설정
export const resetPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "이메일, 비밀번호는 필수 입력 항목입니다.",
    });
    return;
  }

  if (!validator.isEmail(email)) {
    res
      .status(400)
      .json({ success: false, message: "유효한 이메일 주소를 입력하세요." });
    return;
  }

  // 비밀번호 검증 추가 (필요시 주석 해제)
  // if (
  //   !validator.isStrongPassword(password, {
  //     minLength: 8,
  //     minNumbers: 1,
  //     minSymbols: 1,
  //     minUppercase: 0,
  //   }) ||
  //   !allowedSymbolsForPassword.test(password) // 허용된 문자만 포함하는지 확인
  // ) {
  //   res.status(400).json({
  //     success: false,
  //     message:
  //       "비밀번호는 8자리 이상, 영문, 숫자, 특수문자(!@#$%^&*?)를 포함해야 합니다.",
  //   });
  //   return;
  // }

  // Step 1: 사용자 조회
  dbPool
    .query("SELECT * FROM user WHERE email = ?", [email])
    .then((rows: any[]) => {
      if (rows.length === 0) {
        return Promise.reject({
          status: 404,
          message: "일치하는 사용자를 찾을 수 없습니다.",
        });
      }

      // Step 2: 비밀번호 암호화
      return bcrypt.hash(password, 10).then((hashedPassword) => {
        return dbPool.query("UPDATE user SET password = ? WHERE email = ?", [
          hashedPassword,
          email,
        ]);
      });
    })
    .then(() => {
      res.status(200).json({
        success: true,
        message: "비밀번호가 성공적으로 변경되었습니다.",
      });
    })
    .catch((err) => {
      if (err.status) {
        res.status(err.status).json({ success: false, message: err.message });
      } else {
        console.error("비밀번호 변경 중 서버 오류:", err);
        res.status(500).json({
          success: false,
          message: "비밀번호 변경 중 서버 오류가 발생했습니다.",
        });
      }
    });
};
