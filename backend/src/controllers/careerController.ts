import { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

// .env 파일 로드
dotenv.config();

const CAREER_API_BASE_URL = "https://www.career.go.kr/cnet/front/openapi";
const API_KEY = process.env.CAREER_NET_API_KEY;

// 직업 검색 API - 모든 페이지의 직업 정보(이름, 코드) 가져오기
export const searchJobs = async (req: Request, res: Response) => {
  try {
    const { keyword, aptdCodes, themeCode } = req.query;

    if (!keyword && !aptdCodes && !themeCode) {
      res.status(400).json({
        success: false,
        message: "검색어, 적성코드, 또는 테마코드 중 하나 이상 필요합니다",
      });
      return;
    }

    console.log(
      `직업 검색 시작 - 키워드: "${keyword || "없음"}", 적성코드: ${
        aptdCodes || "없음"
      }, 테마코드: ${themeCode || "없음"}`
    );

    // 첫 페이지 요청으로 전체 데이터 개수 확인
    const firstPageResponse = await axios.get(
      `${CAREER_API_BASE_URL}/jobs.json`,
      {
        params: {
          apiKey: API_KEY,
          searchJobNm: keyword || "",
          searchAptdCodes: aptdCodes || "",
          searchThemeCode: themeCode || "",
          pageIndex: 1,
        },
      }
    );

    // 페이지 정보 추출
    const { count, pageSize, pageIndex } = firstPageResponse.data;
    const totalPages = Math.ceil(count / pageSize);

    console.log(`총 결과 수: ${count}개`);
    console.log(`페이지 크기: ${pageSize}`);
    console.log(`총 페이지 수: ${totalPages}`);

    // 모든 직업 정보를 저장할 배열
    const allJobs: { name: string; code: string | number }[] = [];

    // 첫 페이지 결과 추가
    if (
      firstPageResponse.data.jobs &&
      Array.isArray(firstPageResponse.data.jobs)
    ) {
      const firstPageJobs = firstPageResponse.data.jobs.map((job: any) => ({
        name: job.job_nm,
        code: job.job_cd,
      }));
      allJobs.push(...firstPageJobs);
    }

    // 2페이지부터 나머지 페이지 요청
    if (totalPages > 1) {
      const BATCH_SIZE = 5; // Number of pages to fetch in parallel
      for (let i = 2; i <= totalPages; i += BATCH_SIZE) {
        const batchPromises = [];
        for (
          let currentPage = i;
          currentPage < i + BATCH_SIZE && currentPage <= totalPages;
          currentPage++
        ) {
          batchPromises.push(
            axios.get(`${CAREER_API_BASE_URL}/jobs.json`, {
              params: {
                apiKey: API_KEY,
                searchJobNm: keyword || "",
                searchAptdCodes: aptdCodes || "",
                searchThemeCode: themeCode || "",
                pageIndex: currentPage,
              },
            })
          );
        }
        console.log(
          `Fetching pages ${i} to ${Math.min(
            i + BATCH_SIZE - 1,
            totalPages
          )}...`
        );
        const batchResponses = await Promise.all(batchPromises);
        // Process each response in the batch
        batchResponses.forEach((response) => {
          if (response.data.jobs && Array.isArray(response.data.jobs)) {
            const jobs = response.data.jobs.map((job: any) => ({
              name: job.job_nm,
              code: job.job_cd,
            }));
            allJobs.push(...jobs);
          }
        });
      }
    }

    console.log(`총 ${allJobs.length}개의 직업 정보를 가져왔습니다.`);

    // 중복 제거 (직업 코드 기준)
    const uniqueJobMap = new Map();
    allJobs.forEach((job) => {
      if (!uniqueJobMap.has(job.code)) {
        uniqueJobMap.set(job.code, job);
      }
    });

    const uniqueJobs = Array.from(uniqueJobMap.values());
    console.log(
      `중복 제거 후 총 ${uniqueJobs.length}개의 고유 직업 정보가 있습니다.`
    );

    // 결과 반환
    res.status(200).json({
      success: true,
      totalCount: count,
      retrievedCount: allJobs.length,
      uniqueCount: uniqueJobs.length,
      data: {
        jobs: uniqueJobs,
      },
    });
    return;
  } catch (error: any) {
    console.error("직업 검색 API 오류:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "직업 정보를 불러오는데 실패했습니다",
      error: error.response?.data || error.message,
    });
    return;
  }
};

// 직업 상세 정보 조회 API
export const getJobDetail = async (req: Request, res: Response) => {
  try {
    const { jobCode } = req.params;

    if (!jobCode) {
      res.status(400).json({
        success: false,
        message: "직업 코드가 필요합니다",
      });
      return;
    }

    const response = await axios.get(`${CAREER_API_BASE_URL}/job.json`, {
      params: {
        apiKey: API_KEY,
        seq: jobCode, // 직업 코드
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
    return;
  } catch (error: any) {
    console.error("직업 상세 정보 API 오류:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "직업 상세 정보를 불러오는데 실패했습니다",
      error: error.response?.data || error.message,
    });
    return;
  }
};

// 테마별 직업 조회 API
export const getThemes = async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CAREER_API_BASE_URL}/themes.json`, {
      params: {
        apiKey: API_KEY,
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
    return;
  } catch (error: any) {
    console.error("직업 테마 목록 API 오류:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "직업 테마 목록을 불러오는데 실패했습니다",
      error: error.response?.data || error.message,
    });
    return;
  }
};

// 직업 적성 분류 조회 API
export const getAptitudes = async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CAREER_API_BASE_URL}/aptds.json`, {
      params: {
        apiKey: API_KEY,
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
    return;
  } catch (error: any) {
    console.error("직업 적성 분류 API 오류:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "직업 적성 분류를 불러오는데 실패했습니다",
      error: error.response?.data || error.message,
    });
    return;
  }
};

// 모든 직업 코드 목록 조회 API
export const getJobCodes = async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${CAREER_API_BASE_URL}/jobcodes.json`, {
      params: {
        apiKey: API_KEY,
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
    return;
  } catch (error: any) {
    console.error("직업 코드 목록 API 오류:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "직업 코드 목록을 불러오는데 실패했습니다",
      error: error.response?.data || error.message,
    });
    return;
  }
};
