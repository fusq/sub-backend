const axios = require('axios');

async function transcribe(mediaUri, userPrefLanguage = 'en') {
  const { data } = await axios.post(
    "https://api.runpod.ai/v2/brqijd2om7qrjl/run",
    {
      "input": {
        "audio": mediaUri,
        "model": "large-v2",
        "transcription": "srt",
        "word_timestamps": true,
        "language": userPrefLanguage
      }
    },
    { headers: { "Authorization": "Bearer 20HNJLG8OOH6OV43I6E2JWE2YJ3HWWMV2C7KT49M" } }
  );

  const jobId = data.id;
  console.log(`Transcription job ID: ${jobId}`);
  return { jobId };
}

module.exports = transcribe;
