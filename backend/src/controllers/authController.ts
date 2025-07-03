import { Request, Response } from "express";
import { dbPool } from "../config/db";

import bcrypt from "bcrypt"; // 비밀번호 암호화 최신버전 express 에서 가지고 있다함
import nodemailer from "nodemailer"; // 이메일 전송 라이브러리
import validator from "validator"; // 유효성 검사 라이브러리
import jwt from "jsonwebtoken"; // JWT 토큰 생성 및 검증 라이브러리
const allowedSymbolsForPassword = /^[a-zA-Z0-9!@#$%^&*?]*$/; // 허용된 문자만 포함하는지 확인

// 사용자 회원가입
export const register = async (req: Request, res: Response) => {
  const { email, password, name, terms, certificates, interests } = req.body;
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
      `INSERT INTO user (email, password, name, terms, certificates, interests) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
        name,
        JSON.stringify(terms || { privacy: true }),
        certificates || null, // 자격증 추가
        interests || null, // 관심사 추가
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
  const { email } = req.body;

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

    // 이메일 중복 확인
    const existingUserRows = await connection.query(
      "SELECT email, state FROM user WHERE email = ?",
      [email]
    );

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

    // 랜덤 인증 코드 생성
    const generateRandomCode = (n: number): string => {
      let str = "";
      for (let i = 0; i < n; i++) {
        str += Math.floor(Math.random() * 10);
      }
      return str;
    };
    const verificationCode = generateRandomCode(6);

    // 인증 코드 저장 (유효 기간 5분)
    const expiresAt = new Date(new Date().getTime() + 5 * 60 * 1000); // 정확히 5분 후
    await connection.query(
      "INSERT INTO email_verification (email, verification_code, expires_at) VALUES (?, ?, ?)",
      [email, verificationCode, expiresAt]
    );

    // 이메일 전송
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
      from: `"JobTalk" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject: "[JobTalk] 인증번호",
      html: `
      <div style="font-family:'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif; max-width:500px; margin:0 auto;">
        <!-- 헤더 -->
        <div style="background-color:#ff8551; color:white; padding:20px; text-align:left;">
          <h1 style="margin:0; font-size:24px; font-weight:bold;">JobTalk 인증번호</h1>
        </div>
        
        <!-- 본문 -->
        <div style="padding:30px 20px; background-color:white; border:1px solid #e1e1e1; border-top:none;">
          <p style="font-size:16px; color:#404040; margin-bottom:30px;">
            JobTalk 이메일 인증번호입니다.
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
      `SELECT user_id, email, name, user_uuid, job, experience, certificates, interests 
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
        job: userInfo.job, // 직업 정보 추가
        experience: userInfo.experience, // 경력 정보 추가
        certificates: userInfo.certificates, // 자격증 정보 추가
        interests: userInfo.interests, // 관심사 정보 추가
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
      "SELECT password, login_type FROM user WHERE user_id = ? AND state = 'active'",
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

    // 소셜 로그인 사용자는 비밀번호 변경 불가
    if (userInfo.login_type !== "normal") {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: `${
          userInfo.login_type === "kakao" ? "카카오" : "구글"
        } 간편 로그인 사용자는 비밀번호를 변경할 수 없습니다.`,
      });
      return;
    }

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


