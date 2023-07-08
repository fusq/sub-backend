const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const transcribe = require('./transcribe');
const { checkJobStatuses, checkVideosWithReadyReviewedSubtitles } = require("./cronJob");

const { test } = require('./generateSubtitles');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000"],
}));

app.post("/transcribe", async (req, res) => {
  const mediaUri = req.body.mediaUrl;
  const userPrefLanguage = req.body.lang;
  console.log("Transcribing video using Whisper...");
  const jobData = await transcribe(mediaUri, userPrefLanguage);
  return res.json(jobData);
});


app.get('/test', async (req, res) => {
  const data = await test();
  res.json(data);
});

app.listen(3000, () => {
  cron.schedule("0,10,20,30,40,50 * * * * *", checkJobStatuses);
  cron.schedule("0,10,20,30,40,50 * * * * *", checkVideosWithReadyReviewedSubtitles);
  console.log("Server listening on port 3000");
});
