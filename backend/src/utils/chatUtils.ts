import OpenAI from "openai";

// 대화 요약 함수
export async function summarizeWithGPT(
  conversation: { role: string; content: string }[]
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "다음 대화를 3-5문장으로 요약하세요. 사용자의 배경, 관심사, 기술, 경험, 선호도를 중심으로 요약하세요.",
        },
        {
          role: "user",
          content: `대화 기록: ${JSON.stringify(conversation)}`,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("대화 요약 오류:", error);
    return "대화 요약 실패";
  }
}
