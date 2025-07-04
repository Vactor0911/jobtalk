import { Request, Response } from "express";
import { dbPool } from "../config/db";

import bcrypt from "bcrypt"; // 비밀번호 암호화 최신버전 express 에서 가지고 있다함
import axios from "axios";
import nodemailer from "nodemailer"; // 이메일 전송 라이브러리
import validator from "validator"; // 유효성 검사 라이브러리
import jwt from "jsonwebtoken"; // JWT 토큰 생성 및 검증 라이브러리
const allowedSymbolsForPassword = /^[a-zA-Z0-9!@#$%^&*?]*$/; // 허용된 문자만 포함하는지 확인

// 사용자 회원가입
export const register = async (req: Request, res: Response) => {
  const { email, password, name, terms } = req.body;
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
      // 로그인 유형에 따른 메시지 생성
      let loginTypeMsg = "";
      const loginType = rows_email[0].login_type;

      if (loginType === "kakao") {
        loginTypeMsg = "카카오 간편 로그인";
      } else if (loginType === "google") {
        loginTypeMsg = "구글 간편 로그인";
      } else {
        loginTypeMsg = "일반 로그인";
      }

      res.status(400).json({
        success: false,
        message: `이미 가입된 이메일입니다. ${loginTypeMsg}으로 로그인해 주세요.`,
        loginType: loginType,
      });
      return;
    }

    // 비밀번호 검증 추가
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 0,
      }) ||
      !allowedSymbolsForPassword.test(password) // 허용된 문자만 포함하지 않은 경우
    ) {
      res.status(400).json({
        success: false,
        message:
          "비밀번호는 8자리 이상, 영문, 숫자, 특수문자(!@#$%^&*?)를 포함해야 합니다.",
      });
      return;
    }

    // Step 2: 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: 사용자 저장
    await connection.query(
      "INSERT INTO user (email, password, name, terms) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, name, JSON.stringify(terms, null, " ")]
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

    // Step 2: 간편 로그인 사용자 확인
    if (user.login_type !== "normal") {
      let loginTypeName = "";
      if (user.login_type === "kakao") {
        loginTypeName = "카카오";
      } else if (user.login_type === "google") {
        loginTypeName = "구글";
      } else {
        loginTypeName = user.login_type;
      }

      res.status(400).json({
        success: false,
        message: `이 계정은 간편 로그인으로 연동되어 있습니다. \n${loginTypeName} 간편 로그인을 이용해주세요.`,
      });
      return;
    }

    // Step 3: 암호화된 비밀번호 비교
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다. 다시 입력해주세요.",
      });
      return;
    }

    // Step 4: Access Token 발급
    const accessToken = jwt.sign(
      {
        userId: user.user_id,
        userUuid: user.user_uuid, // 사용자 UUID
        name: user.name,
        permission: user.permission,
        login_type: "normal",
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "30m" } // Access Token 만료 시간 30m
    );

    // Step 5: Refresh Token 발급
    const refreshToken = jwt.sign(
      {
        userId: user.user_id,
        userUuid: user.user_uuid, // 사용자 UUID
        name: user.name,
        permission: user.permission,
        login_type: "normal",
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" } // Refresh Token 만료 시간 7d
    );

    // Step 6: Refresh Token 저장 (DB)
    await dbPool.query("UPDATE user SET refresh_token = ? WHERE email = ?", [
      refreshToken,
      email,
    ]);

    // Step 7: 쿠키에 Refresh Token 저장
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 환경에 따라 동적 설정
      // true: HTTPS 환경에서만 작동, 로컬 테스트에선 false로
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // 로컬 개발환경에선 반드시 lax로, 배포시 none + secure:true
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // Step 8: 응답 반환
    res.status(200).json({
      success: true,
      message: "로그인 성공",
      name: user.name,
      userUuid: user.user_uuid, // 사용자 UUID
      userId: user.user_id, // 사용자 ID, 프론트에서 사용
      permissions: user.permission, // 사용자 권한, 프론트에서 사용
      accessToken, // Access Token 반환
      loginType: "normal", // loginType 추가
    });
    return;
  } catch (err: any) {
    // 에러 처리
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
  const { user_uuid, email, purpose } = req.body; // purpose : "verifyEmailCode" / "modifyInfo"
  // 내 정보 수정 기능 추가 시 요청 컬럼 추가

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

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction(); // 트랜잭션 시작

    switch (purpose) {
      case "verifyEmailCode": // 이메일 인증
        // Step 1: 이메일 중복 확인
        const existingUserRows = await connection.query(
          "SELECT email, state, login_type FROM user WHERE email = ?", // state : "active" / "inactive"
          [email]
        );
        const existingUser = existingUserRows[0];

        if (existingUser) {
          if (existingUser.email === email) {
            if (existingUser.state === "inactive") {
              res.status(400).json({
                success: false,
                // 간편 로그인 사용자들의 계정 복구 방식이 필요.
                message: "탈퇴된 계정입니다. 관리자에게 문의해주세요.",
              });
              return;
            }

            if (existingUserRows.length > 0) {
              // 기존 사용자 존재 -> 로그인 유형에 따른 메시지 생성
              let loginTypeMsg = "";
              const loginType = existingUserRows[0].login_type;

              if (loginType === "kakao") {
                loginTypeMsg = "카카오 간편 로그인";
              } else if (loginType === "google") {
                loginTypeMsg = "구글 간편 로그인";
              } else {
                loginTypeMsg = "일반 로그인";
              }

              res.status(400).json({
                success: false,
                message: `이미 가입된 이메일입니다.\n${loginTypeMsg}으로 로그인해 주세요.`,
                loginType, // 클라이언트에서 사용자가 어떤 방식으로 가입되었는지 확인할 수 있게 추가
              });
              return;
            }
          }
        }
        break;

      //TODO : 수정 필요
      case "modifyInfo": // 내 정보 수정
        const modifyRows = await connection.query(
          "SELECT email FROM user WHERE user_uuid = ? AND email = ?",
          [user_uuid, email]
        );
        const modifyUser = modifyRows[0];

        break;

      default:
        res.status(400).json({ success: false, message: "잘못된 요청입니다." });
        return;
    }

    // Step 1: 랜덤 인증 코드 생성
    const generateRandomCode = (n: number): string => {
      let str = "";
      for (let i = 0; i < n; i++) {
        str += Math.floor(Math.random() * 10);
      }
      return str;
    };
    const verificationCode = generateRandomCode(6);

    // Step 2: 인증 코드 저장 (유효 기간 5분)
    // 이건 나중에 한국 표준시로 바꿔야 함
    const expiresAt = new Date(new Date().getTime() + 5 * 60 * 1000); // 정확히 5분 후
    await connection.query(
      "INSERT INTO email_verification (email, verification_code, expires_at) VALUES (?, ?, ?)",
      [email, verificationCode, expiresAt]
    );

    // Step 3: 이메일 전송
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

    const mailOptions = {
      from: `"Wanna Trip" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject: "[Wanna Trip] 인증번호",
      html: `
      <div style="font-family:'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif; max-width:500px; margin:0 auto;">
        <!-- 헤더 -->
        <div style="background-color:#2589ff; color:white; padding:20px; text-align:left;">
          <h1 style="margin:0; font-size:24px; font-weight:bold;">Wanna Trip 인증번호</h1>
        </div>
        
        <!-- 본문 -->
        <div style="padding:30px 20px; background-color:white; border:1px solid #e1e1e1; border-top:none;">
          <p style="font-size:16px; color:#333; margin-bottom:30px;">
            Wanna Trip 이메일 인증번호입니다.
          </p>
          
          <!-- 인증번호 박스 -->
          <div style="background-color:#f4f7fd; padding:20px; text-align:center; margin-bottom:30px; border-radius:4px;">
            <h2 style="font-size:38px; letter-spacing:10px; color:#2589ff; margin:0; font-weight:bold;">${verificationCode}</h2>
          </div>
          
          <!-- 안내문구 -->
          <p style="font-size:14px; color:#888; margin-top:30px; border-top:1px solid #eee; padding-top:20px;">
            본 메일은 발신전용입니다.<br>
            인증번호는 5분간만 유효합니다.
          </p>
          <p style="font-size:13px; color:#999; margin-top:15px;">
            Copyright © WannaTrip Corp. All rights reserved.
          </p>
        </div>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await connection.commit(); // 트랜잭션 커밋
    res.status(200).json({
      success: true,
      message: "인증번호가 이메일로 발송되었습니다.",
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
  const { email, code } = req.body;

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

  try {
    // 인증 코드 검증
    const [record] = await dbPool.query(
      "SELECT verification_code, expires_at FROM email_verification WHERE email = ? ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    if (!record) {
      res
        .status(400)
        .json({ success: false, message: "인증번호가 존재하지 않습니다." });
      return;
    }

    const { verification_code: storedCode, expires_at: expiresAt } = record;

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
    await dbPool.query("DELETE FROM email_verification WHERE email = ?", [
      email,
    ]); // 검증 후 데이터 삭제

    res
      .status(200)
      .json({ success: true, message: "인증번호가 확인되었습니다." });
  } catch (err) {
    console.error("Error verifying code:", err);
    res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

