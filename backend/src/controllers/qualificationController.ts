import { Request, Response } from "express";
import axios from "axios";
import xml2js from "xml2js";
import { dbPool } from "../config/db";

const QUALIFICATION_API_BASE_URL =
  "https://api.odcloud.kr/api/15082998/v1/uddi:6569a851-1216-48d0-a76b-87ac2ee24f07";

const API_KEY = process.env.QUALIFICATION_API_KEY;

// 임시 자격증 데이터
const TEMP_QUALIFICATIONS = [
  "정보처리기사",
  "정보처리산업기사",
  "정보처리기능사",
  "컴퓨터시스템응용기술사",
  "정보관리기술사",
  "정보통신기술사",
  "컴퓨터활용능력 1급",
  "컴퓨터활용능력 2급",
  "워드프로세서",
  "정보보안기사",
  "정보보안산업기사",
  "빅데이터분석기사",
  "SQLD",
  "SQLP",
  "토익",
  "토익스피킹",
  "오픽",
  "JPT",
  "TEPS",
  "HSK",
  "JLPT",
  "리눅스마스터 1급",
  "리눅스마스터 2급",
  "네트워크관리사 2급",
  "AWS 솔루션스 아키텍트",
];

// 임시 자격증 데이터를 DB에 저장하는 함수
const loadTempQualifications = async (connection: any) => {
  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // 기존 데이터 삭제
    await connection.query("DELETE FROM qualifications");

    // 임시 데이터 삽입
    for (const jmfldnm of TEMP_QUALIFICATIONS) {
      await connection.query(
        "INSERT INTO qualifications (jmfldnm) VALUES (?)",
        [jmfldnm]
      );
    }

    // 트랜잭션 커밋
    await connection.commit();

    return {
      success: true,
      totalCount: TEMP_QUALIFICATIONS.length,
      message: "임시 자격증 데이터 로드 완료 (API 키 활성화 전까지 사용됩니다)",
      isTemporary: true,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};

// 모든 자격증 종목명을 API에서 가져와서 DB에 저장하는 함수
export const syncQualificationsToDatabase = async () => {
  const connection = await dbPool.getConnection();

  try {
    if (!API_KEY) {
      throw new Error("API 키가 설정되지 않았습니다.");
    }

    let allQualifications: string[] = [];
    let page = 1;
    const perPage = 1000;
    let hasMoreData = true;

    while (hasMoreData) {
      try {
        const queryParams = new URLSearchParams({
          serviceKey: API_KEY,
          page: page.toString(),
          perPage: perPage.toString(),
          returnType: "JSON",
        });

        const fullUrl = `${QUALIFICATION_API_BASE_URL}?${queryParams.toString()}`;

        const response = await axios.get(fullUrl, {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
        });

        // HTML 응답인지 확인 (API 키 비활성화 상태)
        if (
          typeof response.data === "string" &&
          (response.data.trim().startsWith("<!DOCTYPE html>") ||
            response.data.trim().startsWith("<html"))
        ) {
          throw new Error(
            "API가 아직 준비되지 않았습니다. API 키 활성화를 기다려주세요 (1~2일 소요)"
          );
        }

        const responseData = response.data;

        if (!responseData.data || !Array.isArray(responseData.data)) {
          break;
        }

        // 데이터 처리 - 종목명만 추출
        const processedData = responseData.data
          .filter((item: any) => item.종목명)
          .map((item: any) => item.종목명.trim());

        allQualifications = allQualifications.concat(processedData);

        // 다음 페이지가 있는지 확인
        const totalPages = Math.ceil(responseData.totalCount / perPage);
        hasMoreData = page < totalPages && responseData.currentCount > 0;
        page++;

        // 너무 많은 요청을 방지하기 위한 대기
        if (hasMoreData) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (apiError: any) {
        console.error(`API 호출 실패:`, apiError.message);
        return await loadTempQualifications(connection);
      }
    }

    // 중복 제거 (종목명 기준)
    const uniqueQualifications = [...new Set(allQualifications)];

    // 데이터가 없으면 임시 데이터 사용
    if (uniqueQualifications.length === 0) {
      return await loadTempQualifications(connection);
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 기존 데이터 삭제
    await connection.query("DELETE FROM qualifications");

    // 새 데이터 일괄 삽입
    const batchSize = 500;

    for (let i = 0; i < uniqueQualifications.length; i += batchSize) {
      const batch = uniqueQualifications.slice(i, i + batchSize);

      // 동적 플레이스홀더 생성
      const placeholders = batch.map(() => "(?)").join(", ");
      const sql = `INSERT INTO qualifications (jmfldnm) VALUES ${placeholders}`;

      await connection.query(sql, batch);
    }

    // 트랜잭션 커밋
    await connection.commit();

    return {
      success: true,
      totalCount: uniqueQualifications.length,
      message: "자격증 데이터 동기화가 완료되었습니다.",
      isTemporary: false,
    };
  } catch (error: any) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error("자격증 데이터 동기화 오류:", error.message);

    // 어떤 이유든 오류가 발생하면 임시 데이터 로드
    try {
      return await loadTempQualifications(connection);
    } catch (tempError: any) {
      console.error("임시 데이터 로드 오류:", tempError.message);
      throw error; // 원래 오류를 던짐
    }
  } finally {
    connection.release();
  }
};

// 모든 자격증 종목 조회 API
export const getAllQualifications = async (req: Request, res: Response) => {
  try {
    const qualifications = await dbPool.query(
      "SELECT jmfldnm FROM qualifications ORDER BY jmfldnm"
    );

    res.status(200).json({
      success: true,
      totalCount: qualifications.length,
      data: {
        qualifications: qualifications.map((q: any) => q.jmfldnm),
      },
      message: "모든 자격증 종목 조회를 완료했습니다.",
    });
  } catch (error: any) {
    console.error("자격증 조회 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "자격증 조회에 실패했습니다.",
      error: error.message,
    });
  }
};