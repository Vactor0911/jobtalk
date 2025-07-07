import { Request, Response } from "express";
import axios from "axios";
import xml2js from "xml2js";
import { dbPool } from "../config/db";

const QUALIFICATION_API_BASE_URL =
  "http://openapi.q-net.or.kr/openapi/service/rest/InquiryListNationalQualificationSVC";
const API_KEY = process.env.QUALIFICATION_API_KEY;

// XML을 JSON으로 변환하는 파서 설정
const parser = new xml2js.Parser({
  explicitArray: false,
  ignoreAttrs: false,
  mergeAttrs: true,
  trim: true,
});

// 임시 자격증 데이터
const TEMP_QUALIFICATIONS = [
  { jmcd: "0751", jmfldnm: "정보처리기사" },
  { jmcd: "0752", jmfldnm: "정보처리산업기사" },
  { jmcd: "0753", jmfldnm: "정보처리기능사" },
  { jmcd: "0754", jmfldnm: "컴퓨터시스템응용기술사" },
  { jmcd: "0755", jmfldnm: "정보관리기술사" },
  { jmcd: "0756", jmfldnm: "정보통신기술사" },
  { jmcd: "0915", jmfldnm: "컴퓨터활용능력 1급" },
  { jmcd: "0916", jmfldnm: "컴퓨터활용능력 2급" },
  { jmcd: "1320", jmfldnm: "워드프로세서" },
  { jmcd: "2290", jmfldnm: "정보보안기사" },
  { jmcd: "2291", jmfldnm: "정보보안산업기사" },
  { jmcd: "6921", jmfldnm: "빅데이터분석기사" },
  { jmcd: "4444", jmfldnm: "SQLD" },
  { jmcd: "5555", jmfldnm: "SQLP" },
  { jmcd: "6666", jmfldnm: "토익" },
  { jmcd: "7777", jmfldnm: "토익스피킹" },
  { jmcd: "8888", jmfldnm: "오픽" },
  { jmcd: "9999", jmfldnm: "JPT" },
  { jmcd: "1234", jmfldnm: "TEPS" },
  { jmcd: "5678", jmfldnm: "HSK" },
  { jmcd: "9101", jmfldnm: "JLPT" },
  { jmcd: "2220", jmfldnm: "리눅스마스터 1급" },
  { jmcd: "2221", jmfldnm: "리눅스마스터 2급" },
  { jmcd: "1111", jmfldnm: "네트워크관리사 2급" },
  { jmcd: "3333", jmfldnm: "AWS 솔루션스 아키텍트" },
];

// 임시 자격증 데이터를 DB에 저장하는 함수
const loadTempQualifications = async (connection: any) => {
  try {
    console.log("임시 자격증 데이터 로드 시작...");

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 기존 데이터 삭제
    await connection.query("DELETE FROM qualifications");
    console.log("기존 자격증 데이터 삭제 완료");

    // 임시 데이터 삽입 - 방법 1: 각 행을 개별적으로 삽입
    let count = 0;
    for (const qual of TEMP_QUALIFICATIONS) {
      await connection.query(
        "INSERT INTO qualifications (jmcd, jmfldnm) VALUES (?, ?)",
        [qual.jmcd, qual.jmfldnm]
      );
      count++;
    }

    console.log(`${count}개 임시 자격증 데이터 DB 저장 완료`);

    // 트랜잭션 커밋
    await connection.commit();

    return {
      success: true,
      totalCount: count,
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

    console.log("자격증 데이터 동기화 시작...");
    console.log("API 키 (처음 30자):", API_KEY.substring(0, 30) + "...");
    console.log("API 키 길이:", API_KEY.length);

    // 기술자격(T)과 전문자격(S) 모두 가져오기
    const qualificationTypes = ["T", "S"];
    let allQualifications: Array<{ jmcd: string; jmfldnm: string }> = [];

    for (const qualgbcd of qualificationTypes) {
      console.log(
        `${qualgbcd === "T" ? "기술자격" : "전문자격"} 데이터 조회 중...`
      );

      // URL과 파라미터를 직접 구성하여 인코딩 문제 해결
      const queryParams = new URLSearchParams({
        serviceKey: API_KEY,
        qualgbcd,
        seriescd: "1",
      });

      const fullUrl = `${QUALIFICATION_API_BASE_URL}/getList?${queryParams.toString()}`;
      console.log("요청 URL:", fullUrl);
      console.log("서비스키 인코딩 상태:", API_KEY.substring(0, 30) + "...");

      try {
        // 공공데이터 포털 API 호출
        const response = await axios.get(fullUrl, {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        console.log("API 응답 상태:", response.status);
        console.log("응답 데이터 타입:", typeof response.data);

        // HTML 응답인지 확인
        const responseData = response.data;
        if (
          typeof responseData === "string" &&
          (responseData.trim().startsWith("<!DOCTYPE html>") ||
            responseData.trim().startsWith("<html") ||
            responseData.includes("<meta") ||
            responseData.includes("<head"))
        ) {
          console.log("API가 XML 대신 HTML 페이지를 반환했습니다");
          console.log(
            "이는 API 키가 아직 완전히 활성화되지 않았음을 의미합니다"
          );
          console.log(
            "HTML 응답 (처음 100자):",
            responseData.substring(0, 100)
          );

          throw new Error(
            "API가 아직 준비되지 않았습니다. API 키 활성화를 기다려주세요 (1~2일 소요)"
          );
        }

        // XML 응답을 JSON으로 파싱
        const parsedData = await parser.parseStringPromise(response.data);
        console.log(
          "🔍 파싱된 데이터 구조:",
          JSON.stringify(parsedData, null, 2).substring(0, 500)
        );

        // 에러 체크
        const header = parsedData?.response?.header;
        console.log("API 헤더:", header);

        if (header?.resultCode !== "00") {
          console.error(`API 오류 (${qualgbcd}):`, header?.resultMsg);
          console.error("전체 헤더 정보:", header);
          continue;
        }

        // items 데이터 추출
        const responseBody = parsedData?.response?.body;
        const items = responseBody?.items;

        console.log("Items 데이터 존재:", !!items);
        console.log("Items 타입:", typeof items);

        if (items) {
          let qualifications = [];

          if (Array.isArray(items.item)) {
            qualifications = items.item;
          } else if (items.item) {
            qualifications = [items.item];
          }

          console.log("원시 자격증 데이터 개수:", qualifications.length);

          // 종목코드와 종목명만 추출
          const processedData = qualifications
            .filter((item: any) => item.jmcd && item.jmfldnm) // 유효한 데이터만
            .map((item: any) => ({
              jmcd: item.jmcd.trim(),
              jmfldnm: item.jmfldnm.trim(),
            }));

          allQualifications = allQualifications.concat(processedData);
          console.log(
            `${qualgbcd} - ${processedData.length}개 데이터 수집 완료`
          );

          // 샘플 데이터 출력
          if (processedData.length > 0) {
            console.log("샘플 데이터:", processedData.slice(0, 3));
          }
        } else {
          console.log("Items 데이터가 없습니다.");
        }
      } catch (apiError: any) {
        console.error(`${qualgbcd} API 호출 실패:`, apiError.message);
        if (apiError.response) {
          console.error("응답 상태:", apiError.response.status);
          console.error("응답 데이터:", apiError.response.data);
        }

        // API 오류 발생 - 임시 데이터 사용으로 전환
        console.log("API 오류로 인해 임시 데이터를 사용합니다.");
        return await loadTempQualifications(connection);
      }
    }

    // API 호출 성공 시 데이터 처리

    // 중복 제거 (종목코드 기준)
    const uniqueQualifications = allQualifications.reduce((acc, current) => {
      const exists = acc.find((item) => item.jmcd === current.jmcd);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as Array<{ jmcd: string; jmfldnm: string }>);

    console.log(
      `총 ${uniqueQualifications.length}개의 고유 자격증 데이터 수집 완료`
    );

    // 데이터가 없으면 임시 데이터 사용
    if (uniqueQualifications.length === 0) {
      console.log("API에서 가져온 데이터가 없어 임시 데이터를 사용합니다.");
      return await loadTempQualifications(connection);
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 기존 데이터 삭제
    await connection.query("DELETE FROM qualifications");
    console.log("기존 자격증 데이터 삭제 완료");

    // 새 데이터 일괄 삽입
    const values = uniqueQualifications.map((q) => [q.jmcd, q.jmfldnm]);

    await connection.query(
      "INSERT INTO qualifications (jmcd, jmfldnm) VALUES ?",
      [values]
    );

    console.log(`${uniqueQualifications.length}개 자격증 데이터 DB 저장 완료`);

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
    console.log("오류 발생으로 임시 데이터를 사용합니다.");
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

// 자격증 검색 API (DB에서)
export const searchQualificationsFromDB = async (
  req: Request,
  res: Response
) => {
  try {
    const { keyword } = req.query;

    if (!keyword || (keyword as string).trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "검색어는 2글자 이상 입력해주세요.",
      });
      return;
    }

    const searchTerm = (keyword as string).trim();

    const qualifications = await dbPool.query(
      "SELECT jmcd, jmfldnm FROM qualifications WHERE jmfldnm LIKE ? ORDER BY jmfldnm LIMIT 20",
      [`%${searchTerm}%`]
    );

    res.status(200).json({
      success: true,
      totalCount: qualifications.length,
      data: {
        qualifications: qualifications.map((q: any) => ({
          code: q.jmcd,
          name: q.jmfldnm,
        })),
      },
      message: "자격증 검색을 완료했습니다.",
    });
  } catch (error: any) {
    console.error("자격증 검색 오류:", error.message);
    res.status(500).json({
      success: false,
      message: "자격증 검색에 실패했습니다.",
      error: error.message,
    });
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
