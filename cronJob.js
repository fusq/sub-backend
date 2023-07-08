const axios = require('axios');
const supabase = require('./supabase');

const fetchWords = require('./fetchWords');
const { applySentencesToVideo, saveSentences } = require("./generateSubtitles");
const applySubtitleOnVideo = require("./creatomate");

async function markVideoAsFailed(id) {
  return supabase
    .from('VideoFile')
    .update({status: 'FAILED'})
    .eq('id', id);
}

async function checkJobStatuses() {
  console.log('Started - checkJobStatuses');

  const {data} = await supabase
    .from('VideoFile')
    .select('*')
    .eq('status', 'GENERATING_TEXT');

  if (!data.length) return;

  for (let i = 0; i < data.length; i++) {
    const videoFile = data[i];

    try {
      const {data: response} = await axios.get(
        `https://api.runpod.ai/v2/brqijd2om7qrjl/status/${videoFile.job_id}`,
        {headers: {"Authorization": "Bearer 20HNJLG8OOH6OV43I6E2JWE2YJ3HWWMV2C7KT49M"}}
      );

      const jobStatus = response.status;
      const jobData = response;

      console.log({[videoFile.job_id]: jobStatus});

      if (jobStatus === 'COMPLETED') {
        await supabase
          .from('VideoFile')
          .update({status: 'SUBTITLES_READY'})
          .eq('id', videoFile.id);

        const transcript = await fetchWords(jobData);
        const frames = transcript.map((frame, index) => ({
          start_time: frame.startTime,
          end_time: frame.endTime,
          text: frame.content,
          video: videoFile.id,
          order: index,
          user: videoFile.user
        }));

        await supabase.from('VideoSubtitleFrame').insert(frames);
        await saveSentences(transcript, videoFile);
      }
    } catch (e) {
      console.log('Error', e);
      await markVideoAsFailed(videoFile.id);
    }
  }
}

async function checkVideosWithReadyReviewedSubtitles() {
  console.log('Started - checkVideosWithReadyReviewedSubtitles');

  const {data: videoFiles} = await supabase
    .from("VideoFile")
    .select("*")
    .eq("status", "SUBTITLES_REVIEWED")

  console.log({ videoFiles });

  for (const videoFile of videoFiles) {
    await supabase
      .from("VideoFile")
      .update({ status: "APPLYING_SUBTITLES" })
      .eq("id", videoFile.id)

    const {data: sentences} = await supabase
      .from("VideoSentences")
      .select("*")
      .eq("video", videoFile.id)
      .order("order", {ascending: true});

    try {
      const { keyframes } = await applySentencesToVideo(sentences);
      const result = await applySubtitleOnVideo(videoFile.url, keyframes);
      const status = result?.[0].status;
      const result_url = result?.[0].url;

      if (status === "succeeded") {
        await supabase
          .from('VideoFile')
          .update({
            status: 'COMPLETED',
            result_url
          })
          .eq('id', videoFile.id);
      } else {
        markVideoAsFailed(videoFile.id);
      }
    } catch (e) {
      console.log('CHECK THIS ERROR',e);
    }
  }
}

module.exports = {
  checkJobStatuses,
  checkVideosWithReadyReviewedSubtitles
};
