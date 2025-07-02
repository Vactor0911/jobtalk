import dotenv from "dotenv"; // 환경변수 관리를 위한 라이브러리

// .env 파일 로드
dotenv.config();

const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY, // ← 여기에 본인의 API 키 입력
});

// 비동기 함수로 ChatGPT 호출
export async function chatWithGPT() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Javscript 에서 배열을 선언하는 방법을 알려줘.' },
      ],
      temperature: 0.7,
    });

    console.log('ChatGPT 응답:', response.choices[0].message.content);
  } catch (error) {
    console.error('오류 발생:', error);
  }
}
