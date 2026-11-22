// Sarvam AI Integration Service
// Saaras (Speech-to-Text) & Bulbul (Text-to-Speech)

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

/**
 * Speech-to-Text using Sarvam Saaras
 */
async function speechToText(audioBuffer, originalname = 'voice.wav', mimeType = 'audio/wav') {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey || apiKey === 'your_sarvam_api_key_here') {
    console.warn('[Sarvam AI] No valid SARVAM_API_KEY configured. Falling back to voice recognition handler.');
    return {
      transcript: null,
      language_code: 'en-IN',
      mock: true
    };
  }

  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, originalname);
    formData.append('model', 'saaras:v1');
    formData.append('language_code', 'unknown');

    const res = await fetch(SARVAM_STT_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey
      },
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Sarvam Saaras STT Error]', res.status, errText);
      throw new Error(`Sarvam Saaras STT failed with status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      transcript: data.transcript || '',
      language_code: data.language_code || 'en-IN',
      mock: false
    };
  } catch (err) {
    console.error('[Sarvam STT Exception]', err.message);
    throw err;
  }
}

/**
 * Text-to-Speech using Sarvam Bulbul
 */
async function textToSpeech(text, languageCode = 'en-IN') {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey || apiKey === 'your_sarvam_api_key_here') {
    // Graceful fallback for environments where Sarvam key is pending
    return {
      audioBase64: null,
      mock: true,
      note: 'Configure SARVAM_API_KEY in backend/.env to enable Sarvam Bulbul neural voice synthesis'
    };
  }

  try {
    const targetLang = languageCode === 'ta-IN' ? 'ta-IN' : 'en-IN';
    const speaker = targetLang === 'ta-IN' ? 'meera' : 'arvind';

    const res = await fetch(SARVAM_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        inputs: [text.substring(0, 500)], // Limit length for TTS safety
        target_language_code: targetLang,
        speaker: speaker,
        model: 'bulbul:v1'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Sarvam Bulbul TTS Error]', res.status, errText);
      return {
        audioBase64: null,
        error: `Bulbul TTS API responded with ${res.status}`
      };
    }

    const data = await res.json();
    const audioBase64 = data.audios?.[0] || null;

    return {
      audioBase64,
      mock: false,
      speaker,
      languageCode: targetLang
    };
  } catch (err) {
    console.error('[Sarvam TTS Exception]', err.message);
    return {
      audioBase64: null,
      error: err.message
    };
  }
}

module.exports = {
  speechToText,
  textToSpeech
};
