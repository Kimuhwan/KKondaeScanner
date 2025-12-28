// api/analyze.js
export default async function handler(req, res) {
    // 1. Vercel 환경변수에서 API 키를 가져옴 (보안)
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. 프론트엔드에서 보낸 텍스트 받기
    const { text } = req.body;

    if (!apiKey) {
        return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
    }

    // 3. AI에게 보낼 프롬프트 구성
    const prompt = `
    너는 대한민국 최고의 '꼰대 판독 전문가'야. 입력 텍스트: "${text}"
    분석 항목: 1. 꼰대력(0~100) 2. 비유 캐릭터 3. 팩폭멘트 4. 순화된 표현
    1. 꼰대력: 입력 텍스트가 얼마나 꼰대스러운지 0에서 100까지 점수로 매겨줘.
    2. 비유 캐릭터: 입력 텍스트의 말투를 동물이나 유명인 등으로 비유해서 설명해줘.
    3. 팩폭멘트: 입력 텍스트가 왜 꼰대 같다고 느껴지는지 간단명료하게 팩폭해줘.
    4. 순화된 표현: 입력 텍스트를 더 부드럽고 친근하게 바꿔줘.
    5. 반드시 아래 응답 형식을 지켜서 해줘.
    응답 형식(JSON): {"score": 80, "character": "...", "roast": "...", "fix": "..."}
    `;

    try {
        // 4. 구글 Gemini API 호출 (모델은 1.5-flash가 가장 안정적입니다)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // 5. 결과 처리 및 반환
        if (data.error) {
            throw new Error(data.error.message);
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonText = rawText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonText);

        res.status(200).json(result);

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다." });
    }
}