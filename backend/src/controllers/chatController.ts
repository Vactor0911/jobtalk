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
    if (questionCount >= 8) {
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
      2) 반드시 한 번에 하나의 질문만 하며, 총 질문 횟수(question_count)가 8를 넘지 않도록 관리해요.
      3) 질문이 8회에 도달하면, 반드시 지금까지의 정보를 바탕으로 3~5개의 직업을 추천하고, 아래 JSON 형식 한 줄(JOB_OPTIONS)로 내려보내요.
        JOB_OPTIONS: ["<직업1>","<직업2>","<직업3>"]
        추천 설명에는 반드시 "${userName}님"을 주어로 사용하세요.
      4) 15회 이후에는 이미 추천된 직업이 있는 상태에서, 사용자의 추가 질문이나 다른 직업 추천 요청이 오면 그에 맞게 답변하거나 추가 추천을 해주세요.
      5) 추가 질문/추천 요청은 최대 3회까지만 허용하며, 이후에는 직업 선택만 가능하다고 안내하세요.
      6) 대화가 길어지면 아래 요약 정보를 참고해 맥락을 유지하세요.
      ${historySummary ? "대화 요약: " + historySummary : ""}
      7) 모든 본문은 정중한 “~요”체, 최대 4문장 이내로 작성해요.
      현재까지 질문 횟수: ${questionCount}/8
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
        content: `안녕하세요! 진로 상담을 받고 싶은 학생입니다. 
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
    const getInputMessages = () => [
      {
        role: "system",
        content: `
        당신은 20년 차 진로·상담 전문가입니다.
        사용자가 입력한 **직업명, 관심 분야(카테고리), 보유 자격증**을 바탕으로
        해당 직업을 준비하는 취업준비생이 학습해야 할 과목·언어·자격증을
        **단계별(깊이 우선, 세로형) 부모·자식 노드 트리(로드맵)**로 작성하십시오.

        ─────────────────────
        [출력 규칙]
        1. 결과는 **JSON 배열** 하나만 출력합니다. (마크다운·주석·설명 금지)

        2. 각 노드는 아래 6개 필드만 포함합니다.  
          • id          : 1부터 증가하는 정수  
          • title       : 과목·기술·자격증·단계 등 한글 이름  
          • parent_id   : 부모 id (최상위는 null)  
          • isOptional  : 필수 과정이 아니면 true, 그 외 false  
          • category    : **"job" | "stage" | "skill" | "certificate"** 중 하나  
          • duration    : 해당 노드(과정/단계/기술/자격증)에 권장되는 소요 기간(예: "2주", "3개월", "1년" 등, 한글로)

        3. 노드 생성 규칙  
          • **id = 1** 노드는 반드시 사용자의 직업명으로 지정하고  
            "parent_id": null, "isOptional": false, "category": "job" 으로 설정합니다.  
          • **단계 노드(id = 2~6)** 는 반드시 "category": "stage" 로 지정합니다.  
          • 자격증 노드는 "certificate", 그 밖의 학습 항목은 "skill" 로 지정합니다.

        4. 학습 단계 & 선후관계  
          • 단계 구분: ① 기초 → ② 핵심 → ③ 심화 → ④ 고급 → ⑤ 전문/특화(연구·프로젝트)  
          • 단계 노드는 **세로형(깊이 우선)**으로 연결합니다.  
              2️⃣(기초) parent_id = 1  
              3️⃣(핵심) parent_id = 2  
              4️⃣(심화) parent_id = 3  
              5️⃣(고급) parent_id = 4  
              6️⃣(전문) parent_id = 5  
          • 자격증은 **직접 준비 단계(skill)** 를 선행 노드로 두고,  
            그 단계가 모두 끝난 뒤 certificate 노드를 연결합니다.  

        5. 세부 분해 지침  
          • 모든 **핵심·고급 단계(stage 3·5)의 skill 노드**는 *반드시 최소 2개* 이상의 세부 skill 로 분해합니다.  
          • 프레임워크·언어·툴은 “기본 설정 → 필수 기능 → 고급 기능” 식으로 2-3단계로 쪼갭니다.  
          • **최종 leaf-skill** 은 ‘실무 단위로 더 쪼갤 수 없는 구체 항목’이어야 합니다.  

          *5-A.* 위 분해 규칙이 지켜지지 않거나 minNodes < 50 이면 **“오류”** 만 출력합니다.

        6. 병렬 대안 기술 (선택 분기)  
          • 비슷한 기술(예: Java / Python / Node.js)은 같은 parent_id 를 공유하고  
            각 노드의 isOptional 을 true 로 지정해 **선택 분기**를 만듭니다.

        7. 노드 수 제한  
          • **maxNodes = 80** (초과 시 중요도가 낮은 선택 노드부터 제거)  

        8. 최소‧권장 분량 목표  
          • **minNodes = 50** 이상을 반드시 만족하십시오.  
          • 단, 50은 절대 최소치일 뿐이며 **가능하면 100~150개** 정도로 풍부하게 작성하십시오.  
          • 부족할 때는 leaf-skill 을 더 세분화해 노드를 늘리십시오.

        9. 금지 규칙  
          • 위 6개 필드 외의 속성, 마크다운, 설명, 주석을 **절대 포함하지 마십시오.**

        10. 검증 & 오류  
          • minNodes < 50 이거나 금지된 텍스트가 포함되면  
            출력은 오직 한 단어 **“오류”** 만 적으십시오.
        `,
      },
      {
        role: "user",
        content: `
          저는 ${jobTitle} 직업에 대한 상세한 커리어 로드맵이 필요합니다.
          제 관심 분야는 ${interests || "특별히 명시되지 않음"}이고, 
          보유 자격증은 ${certificates || "없음"}입니다.
          위 정보를 고려해서 **${jobTitle} 직업**에 대한 맞춤형 커리어 로드맵을 제공해주세요.
        `,
      },
    ];

    const MAX_RETRY = 3;
    let retryCount = 0;
    let roadmapData = null;
    let lastOutput = "";

    while (retryCount < MAX_RETRY) {
      // OpenAI API 호출
      const response = await openai.responses.create({
        model: "gpt-4o",
        input: getInputMessages() as any,
        max_output_tokens: 15000,
        temperature: 0.7,
      });

      let output = response.output_text.trim();
      // 마크다운 코드블록 제거
      if (output.startsWith("```")) {
        output = output
          .replace(/^```[a-zA-Z]*\s*/, "")
          .replace(/```$/, "")
          .trim();
      }

      lastOutput = output;

      // "오류"만 반환된 경우 재시도
      if (output === "오류") {
        retryCount += 1;
        continue;
      }

      try {
        roadmapData = JSON.parse(output);
        break; // 파싱 성공 시 반복 종료
      } catch (jsonError) {
        // 파싱 실패 시 재시도
        retryCount += 1;
      }
    }

    if (!roadmapData) {
      res.status(500).json({
        success: false,
        message: "로드맵 데이터 파싱에 실패했습니다.",
        error: "유효한 JSON 로드맵을 생성하지 못했습니다.",
        rawData: lastOutput,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: roadmapData,
      message: "로드맵이 성공적으로 생성되었습니다.",
    });
  } catch (err: any) {
    console.error("로드맵 생성 API 오류:", err);
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "로드맵 생성에 실패했습니다.",
      error: err?.response?.data ?? err.message,
    });
  }
};

// 로드맵 노드 상세정보 제공 API
export const nodeDetailProvider = async (req: Request, res: Response) => {
  try {
    const { workspace_uuid, node_id, title } = req.body;

    // 필수 입력값 체크
    if (!workspace_uuid || !node_id || !title) {
      res.status(400).json({
        success: false,
        message: "workspace_uuid, node_id, title은 필수 입력값입니다.",
      });
      return;
    }

    // workspace_uuid로 roadmap_uuid 조회
    const [roadmapRow] = await dbPool.query(
      "SELECT roadmap_uuid, roadmap_data FROM workspace_roadmaps WHERE workspace_uuid = ? ORDER BY created_at DESC LIMIT 1",
      [workspace_uuid]
    );
    if (!roadmapRow || !roadmapRow.roadmap_uuid) {
      res.status(400).json({
        success: false,
        message: "해당 워크스페이스에 저장된 로드맵이 없습니다.",
      });
      return;
    }
    const roadmap_uuid = roadmapRow.roadmap_uuid;
    const roadmapData = roadmapRow.roadmap_data
      ? JSON.parse(roadmapRow.roadmap_data)
      : null;

    // DB에서 상세 정보 조회
    const [existing] = await dbPool.query(
      "SELECT * FROM node_details WHERE roadmap_uuid = ? AND node_id = ?",
      [roadmap_uuid, node_id]
    );

    // 이미 존재하면 반환
    if (existing) {
      // description이 string이면 파싱
      let detailObj = existing;
      if (typeof existing.description === "string") {
        try {
          const parsed = JSON.parse(existing.description);
          detailObj = { ...existing, ...parsed };
        } catch {
          // 파싱 실패 시 overview만 제공
          detailObj = { ...existing, overview: existing.description };
        }
      }

      // 데이터 반환
      res.status(200).json({
        success: true,
        source: "database",
        data: { nodeDetail: detailObj },
      });
      return;
    }

    // OpenAI로 상세정보 생성
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const inputMessages = [
      {
        role: "system",
        content: `
          당신은 진로·기술·자격증 로드맵 전문가입니다.
          아래는 사용자가 만든 전체 로드맵 데이터입니다. 반드시 이 구조와 맥락을 참고하여, 요청한 노드에 대해 설명하세요.

          [로드맵 전체 데이터]
          ${JSON.stringify(roadmapData, null, 2)}

          아래 노드명에 대해 상세 설명을 아래 JSON 스키마에 맞춰 작성하세요.

          반드시 아래 항목 포함:
          - overview: 개요 및 설명
          - importance: 왜 필요한지 (중요성)
          - applications: 어디에 쓰이는지 (활용 분야)
          - resources: 관련 공식 문서/학습 자료 링크 배열 (title, url, type 포함)
           resources 항목 구성 시 아래 기준 엄수:
            1. 각 링크 도메인에 대해 DNS A 레코드 조회가 성공해야 합니다.
            2. HTTP HEAD 또는 GET 요청 시 반드시 200 상태 코드를 반환해야 합니다.
          - others: 추가 정보
            1. 자격증의 경우 기관명 (organization)과 접수 URL (url) 포함
            2. 기타 기술의 경우 관련 공식 문서 URL (url)과 기관명 (organization) 포함
            3. others 객체는 선택 사항이며, 반드시 필요한 경우에만 포함합니다.
            4. others 객체의 내용은 resources에 포함된 내용과 중복되지 않도록 합니다.

          위 조건을 만족하지 않는 링크는 모두 제외하고,
          국내(한국) 공식 → 해외 공식 순으로 우선순위를 정하며, 
          가능하면 공식 문서에 정확한 URL을 찾아 대체해 주세요.

          아래와 같은 JSON 예시 참고:
          {
            "overview": "...",
            "importance": "...",
            "applications": "...",
            "resources": [{ "title": "...", "url": "...", "type": "공식 문서" }],
            "others": {
              "url": "...",
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
      model: "gpt-4o-mini",
      input: inputMessages as any,
      max_output_tokens: 5000,
      temperature: 0.7,
    });

    const description = response.output_text;
    // (필요시 JSON 파싱 검증 후 저장)
    await dbPool.query(
      `INSERT INTO node_details (roadmap_uuid, node_id, title, description, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [roadmap_uuid, node_id, title, description]
    );

    // 반환 데이터 구성
    let detailObj;
    if (typeof description === "string") {
      try {
        const parsed = JSON.parse(description);
        detailObj = { ...existing, ...parsed };
      } catch {
        // 파싱 실패 시 overview만 제공
        detailObj = { ...existing, overview: description };
      }
    }

    // 데이터 반환
    res.status(200).json({
      success: true,
      source: "openai",
      data: { nodeDetail: detailObj },
    });
    return;
  } catch (err: any) {
    console.error("노드 상세 정보 API 오류:", err);

    // 이미 존재하는 노드 ID로 인한 중복 오류 처리
    if (err.message.includes("no: 1062")) {
      res.status(204);
      return;
    }

    // 기타 오류 처리
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "노드 상세 정보 제공에 실패했습니다.",
    });
  }
};

// 로드맵 챗봇 AI
export const roadmapChatbot = async (req: Request, res: Response) => {
  try {
    const { workspaceUuid, message } = req.body;

    if (!workspaceUuid || !message?.trim()) {
      res.status(400).json({ success: false, message: "입력값이 부족합니다." });
      return;
    }

    // 1. workspace_uuid로 roadmap_data 조회
    const [roadmapRow] = await dbPool.query(
      "SELECT roadmap_data, job_title FROM workspace_roadmaps WHERE workspace_uuid = ? ORDER BY created_at DESC LIMIT 1",
      [workspaceUuid]
    );
    if (!roadmapRow || !roadmapRow.roadmap_data) {
      res.status(404).json({ success: false, message: "로드맵이 없습니다." });
      return;
    }
    const roadmapData = JSON.parse(roadmapRow.roadmap_data);
    const jobTitle = roadmapRow.job_title;

    // 2. system 프롬프트 생성
    const systemPrompt = `
      당신은 "${jobTitle}" 로드맵에 대해 전문적으로 답변하는 수십년 경험의 진로·기술·자격증 로드맵 전문가입니다.
      아래는 사용자가 만든 전체 로드맵 데이터입니다.
      반드시 이 구조와 맥락을 참고하여, 사용자의 질문에 친절하고 구체적으로 답변하세요.

      [로드맵 전체 데이터]
      ${JSON.stringify(roadmapData, null, 2)}

      답변은 항상 "~요"체로, 최대 5문장 이내로 작성하세요.
    `;

    // 3. OpenAI 호출
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const inputMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: inputMessages as any,
      max_output_tokens: 5000,
      temperature: 0.7,
    });

    res.status(200).json({
      success: true,
      answer: response.output_text,
    });
  } catch (err: any) {
    console.error("로드맵 챗봇 API 오류:", err);
    res.status(err?.statusCode || 500).json({
      success: false,
      message: "로드맵 챗봇 API 호출에 실패했습니다.",
      error: err?.response?.data ?? err.message,
    });
  }
};
