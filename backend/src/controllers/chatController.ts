import OpenAI from "openai";
import { Request, Response } from "express";
import { dbPool } from "../config/db";
import { summarizeWithGPT } from "../utils/chatUtils";

// 진로 상담 AI
export const careerMentor = async (req: Request, res: Response) => {
  try {
    // 데이터 받기
    const {
      message,
      previousResponseId,
      interests,
      certificates,
      workspaceUuid,
      userName,
    } = req.body;

    if (!message?.trim()) {
      res
        .status(400)
        .json({ success: false, message: "메시지를 입력해주세요." });
      return;
    }

    // OpenAI API 클라이언트 초기화
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 워크스페이스 정보 조회
    const [workspace] = await dbPool.query(
      "SELECT question_count, history_summary, force_recommend_count FROM workspace WHERE workspace_uuid = ?",
      [workspaceUuid]
    );
    const questionCount = workspace?.question_count ?? 0;
    let historySummary = workspace?.history_summary ?? "";
    let forceRecommendCount = workspace?.force_recommend_count ?? 0;

    // 추천 단계 진입
    let forceRecommend = false;
    if (questionCount >= 15) {
      forceRecommend = true;
    }

    // 추천 단계에서 3회 제한
    if (forceRecommend) {
      if (forceRecommendCount >= 3) {
        // 3회 초과 시 입력 차단 신호
        res.status(200).json({
          success: false,
          isRecommendStage: true,
          isRecommendLimit: true,
          message: "더 이상 추가 추천/질문이 불가합니다. 직업을 선택해주세요.",
        });
        return;
      }
      // 카운트 증가
      await dbPool.query(
        "UPDATE workspace SET force_recommend_count = force_recommend_count + 1 WHERE workspace_uuid = ?",
        [workspaceUuid]
      );
      forceRecommendCount += 1;
    }

    // 첫 대화 여부 판별 (이전 응답 ID가 없고, 질문 카운트도 0이면 진짜 첫 대화)
    const isFirstMessage = !previousResponseId && questionCount === 0;

    // systemPrompt 생성 (항상 DB의 historySummary 사용)
    const systemPrompt = `
      당신은 진로 상담 전문가입니다.
      1) ${userName}님이 제공한 관심 분야·보유 자격증을 참고해요.
      2) 반드시 한 번에 하나의 질문만 하며, 총 질문 횟수(question_count)가 15를 넘지 않도록 관리해요.
      3) 질문이 15회에 도달하면, 반드시 지금까지의 정보를 바탕으로 3~5개의 직업을 추천하고, 아래 JSON 형식 한 줄(JOB_OPTIONS)로 내려보내요.
        JOB_OPTIONS: ["<직업1>","<직업2>","<직업3>"]
        추천 설명에는 반드시 "${userName}님"을 주어로 사용하세요.
      4) 20회 이후에는 이미 추천된 직업이 있는 상태에서, 사용자의 추가 질문이나 다른 직업 추천 요청이 오면 그에 맞게 답변하거나 추가 추천을 해주세요.
      5) 추가 질문/추천 요청은 최대 3회까지만 허용하며, 이후에는 직업 선택만 가능하다고 안내하세요.
      6) 대화가 길어지면 아래 요약 정보를 참고해 맥락을 유지하세요.
      ${historySummary ? "대화 요약: " + historySummary : ""}
      7) 모든 본문은 정중한 “~요”체, 최대 4문장 이내로 작성해요.
      현재까지 질문 횟수: ${questionCount}/15
    `;

    //  inputMessages 구성
    let inputMessages = [
      { role: "system", content: systemPrompt },
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

    // 첫 대화
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
      // 질문 15회 전/후/추가 3회 모두 사용자의 입력을 그대로 전달
      inputMessages.push({
        role: "user",
        content: `${message}
          답변은 항상 "~요" 체로, 3~5줄 내외로 간결하게 작성하세요.`,
      });
    }

    const [workspaceRow] = await dbPool.query(
      "SELECT history_summary FROM workspace WHERE workspace_uuid = ?",
      [workspaceUuid]
    );
    let latestHistorySummary = workspaceRow?.history_summary ?? "";

    // OpenAI 호출 시 previous_response_id 조건에 최신 값 사용
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: inputMessages as any,
      previous_response_id: latestHistorySummary
        ? undefined
        : previousResponseId
        ? String(previousResponseId)
        : undefined,
      max_output_tokens: 15000,
      temperature: 0.7,
    });

    // usage.total_tokens 체크
    const usage = response.usage;
    const totalTokens = usage?.total_tokens ?? 0;

    // 질문 카운트 증가 (직업 추천 강제 단계가 아닐 때만)
    if (!forceRecommend) {
      await dbPool.query(
        "UPDATE workspace SET question_count = question_count + 1 WHERE workspace_uuid = ?",
        [workspaceUuid]
      );
    }

    // 13000 토큰 이상이면 요약만 저장 (다음 질문부터 적용)
    const MIN_TOKENS_FOR_SUMMARY = 3000; // 요약을 위한 최소 토큰 수

    if (
      !forceRecommend &&
      totalTokens >= MIN_TOKENS_FOR_SUMMARY &&
      !historySummary
    ) {
      const conversationHistory = await dbPool.query(
        `SELECT role, content FROM workspace_chats WHERE workspace_uuid = ? ORDER BY message_index ASC LIMIT 50`,
        [workspaceUuid]
      );
      const summary = await summarizeWithGPT(conversationHistory);
      await dbPool.query(
        "UPDATE workspace SET history_summary = ? WHERE workspace_uuid = ?",
        [summary, workspaceUuid]
      );
      // 이번 응답에는 적용되지 않고, 다음 질문부터 systemPrompt에 반영됨
    }

    // historySummary가 이미 존재해서 systemPrompt에 포함된 경우(즉, 요약을 사용한 질문 직후)
    //    → history_summary를 초기화해서 다음 질문부터는 다시 전체 대화로 진행
    if (historySummary) {
      await dbPool.query(
        "UPDATE workspace SET history_summary = '' WHERE workspace_uuid = ?",
        [workspaceUuid]
      );
    }

    res.status(200).json({
      success: true,
      answer: response.output_text, // OpenAI 응답 본문
      previous_response_id: response.id, // 이전 응답 ID
      usage: response.usage, // 사용량 정보
      isRecommendStage: forceRecommend, // 추천 단계 여부
      forceRecommendCount, // 강제 추천 카운트
      isRecommendLimit: forceRecommend && forceRecommendCount >= 3, // 추천 제한 여부
      questionCount: questionCount + 1, // 현재 질문 카운트
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

// 로드맵 생성 API
export const generateCareerRoadmap = async (req: Request, res: Response) => {
  try {
    // 데이터 받기
    const { jobTitle, interests, certificates } = req.body;

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
          당신은 20년 차 진로·학습 로드맵 전문가입니다.
          사용자가 입력한 **직업명, 관심 분야(카테고리), 보유 자격증**을 바탕으로
          해당 직업에 필요한 학습·자격증 로드맵 트리를 작성하십시오.

          [출력 규칙]
          1. 결과는 **JSON 배열** 하나로만 출력합니다. (마크다운·주석·설명 절대 금지)

          2. 각 노드는 아래 5개 필드만 포함합니다.  
            • id          : 1부터 증가하는 정수  
            • title       : 과목·기술·자격증·경력 단계 등 한글로 된 노드 이름  
            • parent_id   : 부모 id (최상위는 null)  
            • isOptional  : 필수 과정이 아니면 true, 그 외 false  
            • category    : 노드 카테고리 유형. "skill" | "certificate" | "job" 중 하나  

          3. 선후관계 규칙  
            • A 과목을 배우려면 B 과목이 선행 → B 다음에 A 연결  
            • C 과목을 이수한 뒤 D 자격증 준비 가능 → C 다음에 D 연결  
            • E 과목 이수 후 F 과목을 추가 학습해도 됨 → E 다음에 F 연결  

          4. **노드 수·깊이 제한**  
            • 기본값: maxNodes = 35, maxDepth = 6  
            • 사용자 프롬프트 끝에 "옵션" 객체가 주어지면 해당 값으로 덮어쓰십시오.  
            • 제약을 초과하면 중요도가 낮은 **선택 노드**부터 제거하여 조건을 만족시킵니다.  

          5. 위 규칙을 어기거나 JSON 외의 텍스트가 포함되면 출력은 **오류**로 간주됩니다.
        `,
      },
      {
        role: "user",
        content: `
          저는 ${jobTitle} 직업에 대한 상세한 커리어 로드맵이 필요합니다.
          제 관심 분야는 ${interests || "특별히 명시되지 않음"}이고, 
          보유 자격증은 ${certificates || "없음"}입니다.
          위 정보를 고려해서 맞춤형 커리어 로드맵을 JSON 형식으로 제공해주세요.
        `,
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

// 로드맵 노드 세부사항 제공 API
export const nodeDetailProvider = async (req: Request, res: Response) => {
  try {
    const { roadmap_uuid, node_id, title } = req.body;

    // 필수 입력값 체크
    if (!roadmap_uuid || !node_id || !title) {
      res.status(400).json({
        success: false,
        message: "roadmap_uuid, node_id, title은 필수 입력값입니다.",
      });
      return;
    }

    // 1. DB에서 상세 정보 조회
    const [existing] = await dbPool.query(
      "SELECT * FROM node_details WHERE roadmap_uuid = ? AND node_id = ?",
      [roadmap_uuid, node_id]
    );

    if (existing) {
      // 이미 있으면 DB 값 반환
      res.status(200).json({
        success: true,
        source: "database",
        data: { nodeDetail: existing },
      });
      return;
    }

    // 2. 없으면 OpenAI로 상세 설명 생성
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const inputMessages = [
      {
        role: "system",
        content: `
          당신은 진로·기술·자격증 로드맵 전문가입니다.
          아래 노드명에 대해 상세 설명을 아래 JSON 스키마에 맞춰 작성하세요.

          반드시 아래 항목 포함:
          - overview: 개요 및 설명
          - importance: 왜 필요한지 (중요성)
          - applications: 어디에 쓰이는지 (활용 분야)
          - resources: 관련 공식 문서/학습 자료 링크 배열 (title, url, type 포함)
          - examInfo: 자격증일 경우만 포함 (registrationUrl, organization 등)

          아래와 같은 JSON 예시 참고:
          {
            "overview": "...",
            "importance": "...",
            "applications": "...",
            "resources": [{ "title": "...", "url": "...", "type": "공식 문서" }],
            "examInfo": {
              "registrationUrl": "...",
              "organization": "..."
            }
          }

          반드시 JSON만 출력하세요.`,
      },
      {
        role: "user",
        content: `"${title}" 노드에 대한 정보를 위 스키마에 맞춰 작성해주세요.`,
      },
      {
        role: "developer",
        content:
          "응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운, 주석, 설명 없이 JSON만 반환하세요.",
      },
    ];

    const response = await openai.responses.create({
      model: "gpt-4",
      input: inputMessages as any,
      max_output_tokens: 5000,
      temperature: 0.7,
    });

    // 3. 결과 파싱 및 DB 저장
    let description = response.output_text;
    // (필요시 JSON 파싱 검증 후 저장)
    await dbPool.query(
      `INSERT INTO node_details (roadmap_uuid, node_id, title, description, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [roadmap_uuid, node_id, title, description]
    );

    res.status(200).json({
      success: true,
      source: "openai",
      data: { nodeDetail: { roadmap_uuid, node_id, title, description } },
    });
    return;
  } catch (err: any) {
    console.error("노드 상세 정보 API 오류:", err);
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "노드 상세 정보 제공에 실패했습니다.",
      error: err?.response?.data ?? err.message,
    });
  }
};
