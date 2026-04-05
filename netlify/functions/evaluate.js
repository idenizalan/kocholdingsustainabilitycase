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
                        content: `Sen bir prompt degerlendirme uzmanisin. Kullanici sana bir yapay zeka promptu gonderecek.
Senin gorevin bu promptun kalitesini degerlendirmek.

Asagidaki kriterlere gore 0-100 arasi bir puan ver:
- Aciklik: Prompt ne istedigini acikca belirtiyor mu? (0-25 puan)
- Detay: Yeterli detay ve baglan iceriyor mu? (0-25 puan)
- Amac: Belirli bir amaci veya hedefi var mi? (0-25 puan)
- Yaraticilik: Ilginc veya dusunceli bir prompt mu? (0-25 puan)

ONEMLI: Cevabini SADECE asagidaki JSON formatinda ver, baska hicbir sey yazma:
{"puan": <sayi>, "aciklik": <sayi>, "detay": <sayi>, "amac": <sayi>, "yaraticilik": <sayi>, "degerlendirme": "<2-3 cumlelik Turkce aciklama>"}`
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
