import OpenAI from "openai";
import { Request, Response } from "express";
import { dbPool } from "../config/db";

// 진로 상담 및 로드맵 생성 AI
export const careerMentor = async (req: Request, res: Response) => {
  try {
    // 데이터 받기
    const { message, previousResponseId, interests, certificates } = req.body;

    if (!message?.trim()) {
      res
        .status(400)
        .json({ success: false, message: "메시지를 입력해주세요." });
      return;
    }

    // OpenAI API 클라이언트 초기화
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 첫 대화인지 확인
    const isFirstMessage = !previousResponseId;

    // input 배열 구성
    let inputMessages = [
      {
        role: "system",
        content: `
          당신은 진로 상담 전문가입니다.
            1) 사용자가 제공한 관심 분야와 보유 자격증을 바탕으로,
            2) 한번에 하나의 질문으로, 최대 20회 질문을 통해 성향·목표·경력·학습 이력 등을 추가 수집하세요.
            3) 최종적으로 3~5개 적합한 직업을 추천하고, 사용자가 선택하도록 유도하세요.
            4) 선택된 직업별로 JSON 형식의 로드맵을 생성하세요.
              - 기술: 나무위키·공식 문서 URL 포함
              - 자격증: 시험 접수 페이지 URL 포함
        `,
      },
      {
        role: "developer",
        content: "output must be valid JSON when returning the roadmap.",
      },
    ];

    // 첫 대화일 때만 자격증과 관심분야 정보 추가
    if (isFirstMessage) {
      inputMessages.push({
        role: "user",
        content: `안녕하세요! 진로 상담을 받고 싶습니다. 
        제가 보유한 자격증은 ${certificates}이고, 
        관심 분야는 ${interests}입니다. 
        ${message}
        답변은 항상 "~요" 체로, 3~5줄 내외로 간결하게 작성하세요.`,
      });
    } else {
      // 이후 대화에서는 메시지만 추가
      inputMessages.push({
        role: "user",
        content: `${message}
        답변은 항상 "~요" 체로, 3~5줄 내외로 간결하게 작성하세요.`,
      });
    }

    // Responses API 호출
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: inputMessages as any,
      previous_response_id: previousResponseId ? String(previousResponseId) : undefined, // 정수를 문자열로 변환
      // stream: false   // 필요하면 true 로 변경

      max_output_tokens: 15000, // 한 번에 최대 10000 토큰
      temperature: 0.7, // 0(가장 결정적) ~ 1.0(가장 창의적)
    });

    // 결과 반환
    res.status(200).json({
      success: true,
      answer: response.output_text,
      previous_response_id: response.id, // 다음 대화에서 사용
      usage: response.usage, // 토큰/비용 모니터링
    });
  } catch (err: any) {
    console.error("Chat API 오류:", err);
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "챗봇 API 호출에 실패했습니다.",
      error: err?.response?.data ?? err.message,
    });
  }
};

// 로드맵 노드 상세 정보 제공 AI
export const nodeDetailProvider = async (req: Request, res: Response) => {
  try {
    const { nodeId, nodeName, nodeType, parentNode } = req.body;

    // 필수 입력값 확인
    if (!nodeId || !nodeName) {
      res.status(400).json({
        success: false,
        message: "노드 ID와 이름은 필수 입력값입니다.",
      });
      return;
    }

    // DB에서 노드 정보 조회
    const existingNodeDetails = await dbPool.query(
      "SELECT * FROM node_details WHERE node_id = ?",
      [nodeId]
    );

    // DB에 정보가 이미 있으면 바로 반환
    if (existingNodeDetails.length > 0) {
      res.status(200).json({
        success: true,
        source: "database",
        data: {
          nodeDetail: existingNodeDetails[0],
        },
      });
      return;
    }

    // DB에 정보가 없으면 OpenAI API 호출하여 생성
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const inputMessages = [
      {
        role: "system",
        content: `당신은 모든 직업에 대한 기술, 자격증, 직무 관련 전문 정보를 제공하는 AI입니다.
        다음 정보에 대한 상세 설명을 JSON 형식으로 제공해주세요:
        1. 기술/자격증 개요 및 설명
        2. 필요성 및 중요도
        3. 활용 분야 및 사용처
        4. 관련 공식 문서나 학습 자료 링크
        5. 자격증인 경우 시험 접수 페이지 링크`,
      },
      {
        role: "user",
        content: `"${nodeName}" 노드에 대한 상세 정보를 제공해주세요.
        노드 타입: ${nodeType || "기술"}
        상위 카테고리: ${parentNode || "없음"}`,
      },
    ];

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: inputMessages as any,
      max_output_tokens: 15000, // 최대 15000 토큰
      temperature: 0.7, // 0(가장 결정적) ~ 1.0(가장 창의적)
    });

    // 응답 파싱 및 DB 저장
    const nodeDetail = {
      description: response.output_text,
      created_at: new Date(),
    };

    await dbPool.query(
      "INSERT INTO node_details (node_id, node_name, node_type, parent_node, description, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nodeId,
        nodeName,
        nodeType || "기술",
        parentNode || null,
        nodeDetail.description,
        nodeDetail.created_at,
      ]
    );

    // 결과 반환
    res.status(200).json({
      success: true,
      source: "openai",
      data: {
        nodeDetail,
      },
    });
  } catch (err: any) {
    console.error("노드 상세 정보 API 오류:", err);
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "노드 상세 정보 제공에 실패했습니다.",
      error: err?.response?.data ?? err.message,
    });
  }
};
