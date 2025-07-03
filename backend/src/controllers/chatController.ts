import OpenAI from "openai";
import { Request, Response } from "express";

export const chatTest = async (req: Request, res: Response) => {
  try {
    // 데이터 받기
    const { message, previousResponseId } = req.body as {
      message?: string;
      previousResponseId?: string; // ← 직전 응답 ID (optional)
    };

    if (!message?.trim()) {
      res
        .status(400)
        .json({ success: false, message: "메시지를 입력해주세요." });
      return;
    }

    // OpenAI API 클라이언트 초기화
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Responses API 호출
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: `
        당신은 진로 상담 전문가입니다.
        사용자의 성향·관심사·보유 자격증을 분석해 꼭 맞는 직업을 추천하세요.
        답변은 항상 '~요' 체로, 3~5줄 내외로 간결하게 작성합니다.
      `,
      input: [
        { role: "system", content: "모든 화폐는 반드시 원화(₩)로 표시하세요." },
        { role: "developer", content: "output must be valid markdown" },
        { role: "user", content: message },
      ],
      previous_response_id: previousResponseId ?? undefined, // 직전 응답 ID (없으면 undefined)
      // stream: false   // 필요하면 true 로 변경

      max_output_tokens: 10000, // 한 번에 최대 10000 토큰
      temperature: 0.7, // 0(가장 결정적) ~ 1.0(가장 창의적)
    });

    // 결과 반환
    res.status(200).json({
      success: true,
      answer: response.output_text,
      responseId: response.id, // 다음 대화에서 previous_response_id 로 사용
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
