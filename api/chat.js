// api/chat.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    // 🔑 Your API keys are stored in Vercel environment variables
    const openaiKey = process.env.OPENAI_API_KEY;
    const elevenKey = process.env.ELEVEN_API_KEY;
    const voiceId = process.env.ELEVEN_VOICE_ID;

    // Step 1: Get AI response from OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: message
      })
    });

    const aiData = await aiResponse.json();
    const reply = aiData.output?.[0]?.content?.[0]?.text || 'Sorry, I had trouble responding.';

    // Step 2: Convert that reply into voice using ElevenLabs
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: reply,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.4, similarity_boost: 0.7 }
      })
    });

    const audioBuffer = await ttsResponse.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
