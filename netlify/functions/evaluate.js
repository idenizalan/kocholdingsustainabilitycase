exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const { prompt } = JSON.parse(event.body);

    if (!prompt || prompt.trim().length < 10) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Prompt en az 10 karakter olmali.' })
        };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key ayarlanmamis.' })
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Sen bir prompt değerlendirme uzmanısın. Kullanıcı sana bir yapay zekâ promptu gönderecek.
Senin görevin bu promptun kalitesini değerlendirmek.

Aşağıdaki kriterlere göre 0-100 arası bir puan ver:
- Açıklık: Prompt ne istediğini açıkça belirtiyor mu? (0-25 puan)
- Detay: Yeterli detay ve bağlam içeriyor mu? (0-25 puan)
- Amaç: Belirli bir amacı veya hedefi var mı? (0-25 puan)
- Yaratıcılık: İlginç veya düşünceli bir prompt mu? (0-25 puan)

ÖNEMLİ: Cevabını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:
{"puan": <sayı>, "aciklik": <sayı>, "detay": <sayı>, "amac": <sayı>, "yaraticilik": <sayı>, "degerlendirme": "<2-3 cümlelik Türkçe açıklama>"}`
                    },
                    {
                        role: 'user',
                        content: `Su promptu degerlendir:\n\n"${prompt}"`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `OpenAI API hatasi: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: content
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
