// api/analyze.js (디버깅용 수정버전)
export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;

    // 🔍 [디버깅 1] Vercel 로그에 키 상태 출력 (키 자체는 보안상 *로 가림)
    console.log("---------------------------------------------------");
    console.log("API 호출됨!");
    console.log("현재 등록된 API KEY 상태:", apiKey ? "✅ 존재함 (값 있음)" : "❌ 없음 (undefined)");
    console.log("---------------------------------------------------");

    // 1. 키가 없을 때 명확한 에러 메시지 보내기
    if (!apiKey) {
        return res.status(500).json({ 
            error: "CRITICAL_ERROR", 
            message: "Vercel 환경변수(Env)가 비어있습니다. Settings에서 GEMINI_API_KEY를 확인하고 재배포하세요." 
        });
    }

    const { text } = req.body;
    
    // ... (이하 로직 동일) ...
    const prompt = `너는 꼰대 판독기야. 텍스트: "${text}". JSON으로 답해줘: {"score": 80, "character": "...", "roast": "...", "fix": "..."}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        // 구글 에러가 났을 때 확인
        if (data.error) {
            console.error("구글 API 에러:", data.error);
            return res.status(500).json({ error: "GOOGLE_API_ERROR", message: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonText = rawText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonText);

        res.status(200).json(result);

    } catch (error) {
        console.error("서버 내부 에러:", error);
        res.status(500).json({ error: "SERVER_ERROR", message: error.message });
    }
}