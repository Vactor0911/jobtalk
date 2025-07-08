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
            1) 사용자가 제공한 관심 분야·보유 자격증을 우선 참고해요.  
            2) 부족한 정보(성향·목표·경력·학습 이력 등)는 **한 번에 하나의 질문**으로만 수집하며,  
              총 질문 횟수(question_count)가 20을 넘지 않도록 관리해요.  
            3) 충분한 정보가 모이면 3-5개 직업을 추천하고, 사용자가 선택하도록 유도해요.  
            4) 추천 직업은 반드시 아래 JSON 형식 한 줄로 내려보내요.  

            JOB_OPTIONS: ["<직업1>","<직업2>","<직업3>"]

            5) 사용자가 직업을 고르는 방식
              • 사용자가 JOB_SELECTED: <직업명>을 보내면 선택 완료로 간주
              • 선택이 없고 “다른 추천”을 요청하면 3)-4) 단계 반복

            6) 모든 본문은 정중한 “~요”체, 최대 4문장 이내로 작성해요.
        `,
      },
      {
        role: "developer",
        content: `
          • 질문 단계일 때는 본문 없이 QUESTION: 한 줄만 출력.
            예) QUESTION: 풀타임과 프리랜서 중 어느 형태를 선호하시나요?
          • QUESTION: 줄은 딱 하나의 물음표만 포함하며 쉼표·번호·줄바꿈 없이 작성.
          • 추천 단계에서는 본문 1-3문장 + JOB_OPTIONS: JSON 한 줄.
          • 어떤 단계에서든 규칙을 절대 어기지 말 것.
        `,
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
      previous_response_id: previousResponseId
        ? String(previousResponseId)
        : undefined, // 정수를 문자열로 변환
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

// 로드맵 생성 전용 API 추가
export const generateCareerRoadmap = async (req: Request, res: Response) => {
  try {
    // 데이터 받기
    const {
      jobTitle,
      interests,
      certificates,
      userSkills,
      previousExperience,
    } = req.body;

    if (!jobTitle?.trim()) {
      res
        .status(400)
        .json({ success: false, message: "직업명을 입력해주세요." });
      return;
    }

    // OpenAI API 클라이언트 초기화
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 로드맵 생성용 프롬프트
    const inputMessages = [
      {
        role: "system",
        content: `
          당신은 커리어 로드맵 생성 전문가입니다. 
          사용자가 선택한 직업(${jobTitle})에 대한 상세한 학습 및 커리어 로드맵을 생성해주세요.
          반드시 다음 구조의 JSON 형식으로 응답하세요:
          
          {
            "title": "직업 제목",
            "description": "직업에 대한 간략한 설명",
            "jobOutlook": "취업 전망 및 시장 상황",
            "recommendedFor": "이런 사람에게 추천",
            "skills": [
              {
                "name": "기술 이름",
                "category": "기초/필수/고급 중 하나",
                "description": "기술 설명",
                "priority": "우선순위(상/중/하)",
                "resources": [
                  {
                    "title": "학습 자료 제목",
                    "type": "영상/문서/강의 중 하나",
                    "url": "참고 URL(나무위키, 공식문서 등)",
                    "difficulty": "난이도(입문/중급/고급)"
                  }
                ]
              }
            ],
            "certificates": [
              {
                "name": "자격증 이름",
                "importance": "중요도(필수/권장/선택)",
                "description": "자격증 설명",
                "examInfo": "시험 정보",
                "registrationUrl": "시험 접수 페이지 URL",
                "preparationTime": "준비 기간"
              }
            ],
            "careerPath": [
              {
                "stage": "단계 이름(취업준비/신입/주니어/시니어 등)",
                "duration": "기간",
                "goals": ["목표1", "목표2"],
                "focusAreas": ["집중 분야1", "집중 분야2"]
              }
            ],
            "additionalTips": "추가 조언"
          }
        `,
      },
      {
        role: "user",
        content: `
          저는 ${jobTitle} 직업에 대한 상세한 커리어 로드맵이 필요합니다.
          제 관심 분야는 ${interests || "특별히 명시되지 않음"}이고, 
          보유 자격증은 ${certificates || "없음"}입니다.
          ${userSkills ? `현재 보유 기술: ${userSkills}` : ""}
          ${previousExperience ? `이전 경험: ${previousExperience}` : ""}
          위 정보를 고려해서 맞춤형 커리어 로드맵을 JSON 형식으로 제공해주세요.
        `,
      },
      {
        role: "developer",
        content:
          "응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운이나 추가 설명 없이 JSON만 반환하세요.",
      },
    ];

    // OpenAI API 호출
    const response = await openai.responses.create({
      model: "gpt-4", // 또는 더 뛰어난 gpt-4
      input: inputMessages as any,
      max_output_tokens: 15000,
      temperature: 0.7,
    });

    try {
      // JSON 파싱 검증
      const roadmapData = JSON.parse(response.output_text);

      // 결과 반환
      res.status(200).json({
        success: true,
        data: roadmapData,
        message: "로드맵이 성공적으로 생성되었습니다.",
      });
    } catch (jsonError) {
      console.error("JSON 파싱 오류:", jsonError);
      const errorMessage =
        jsonError instanceof Error
          ? jsonError.message
          : "Unknown parsing error";
      res.status(500).json({
        success: false,
        message: "로드맵 데이터 파싱에 실패했습니다.",
        error: errorMessage,
        rawData: response.output_text,
      });
    }
  } catch (err: any) {
    console.error("로드맵 생성 API 오류:", err);
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "로드맵 생성에 실패했습니다.",
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
