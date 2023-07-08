const axios = require("axios");
const Creatomate = require("creatomate");
const supabase = require("./supabase");

const MAX_RETRIES = 3; // set the maximum number of retries
const DELAY_BETWEEN_REQUESTS = 1000; // delay in milliseconds

async function getEmojiForText(content, retries = 0) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer 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`,
  };

  const data = {
    model: "text-davinci-003",
    prompt: `Please reply with 1 most appropriate emoji based on this sentence: "${content}"`,
    max_tokens: 100,
    temperature: 0, // Set temperature to 0 for deterministic output
    n: 1, // Generate only 1 response
  };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      data,
      {headers: headers, timeout: 5000}
    );
    let message = response.data.choices[0].text;
    message = message.trim();
    return message;
  } catch (error) {
    console.log(error.response.statusText);
    if (retries < MAX_RETRIES) {
      console.log(`Retrying... (${retries + 1})`);
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      ); // Add delay before retrying
      return await getEmojiForText(content, retries + 1);
    } else {
      console.error("No emoji");
      return "";
    }
  }
}

function createSRTFromTranscript(transcript) {
  let sentences = [];
  let currentSentence = {
    startTime: transcript[0].startTime,
    endTime: 0,
    content: "",
  };
  const sentenceEndCharacters = [".", "!", "?", ","];
  const sentenceEndWords = [
    "et",
    "ou",
    "or",
    "and",
    "mais",
    "qui",
    "du",
    "who",
    "but",
    "y",
    "o",
    "und",
    "oder",
    "e",
    "o",
    "e",
    "ou",
    "en",
    "of",
    "и",
    "или",
    "と",
    "または",
    "和",
    "或",
    "that",
    "of",
    "que",
    "de",
    "dass",
    "von",
    "che",
    "di",
    "que",
    "de",
    "dat",
    "van",
    "что",
    "из",
    "の",
    "的",
    "pour",
    "for",
    "für",
    "per",
    "para",
    "voor",
    "для",
    "のために",
    "为",
  ];

  for (let i = 0; i < transcript.length; i++) {
    let word = transcript[i];
    currentSentence.content += currentSentence.content
      ? " " + word.content
      : word.content;

    if (sentenceEndCharacters.includes(word.content?.slice(-1))) {
      currentSentence.endTime = word.endTime;
      sentences.push(currentSentence);
      if (transcript[i + 1]) {
        currentSentence = {
          startTime: transcript[i + 1].startTime,
          endTime: 0,
          content: "",
        };
      }
    } else if (
      currentSentence.content.length > 12 &&
      i < transcript.length - 1 &&
      sentenceEndWords.includes(transcript[i + 1].content?.toLowerCase())
    ) {
      currentSentence.endTime = word.endTime;
      sentences.push(currentSentence);
      if (transcript[i + 1]) {
        currentSentence = {
          startTime: transcript[i + 1].startTime,
          endTime: 0,
          content: "",
        };
      }
    } else if (
      currentSentence.content.length > 20 &&
      !(
        i < transcript.length - 1 &&
        sentenceEndCharacters.includes(transcript[i + 1]?.content?.slice(-1))
      )
    ) {
      currentSentence.endTime = word.endTime;
      sentences.push(currentSentence);
      if (transcript[i + 1]) {
        currentSentence = {
          startTime: transcript[i + 1].startTime,
          endTime: 0,
          content: "",
        };
      }
    }
  }

  if (
    currentSentence.content?.trim() !== "" &&
    currentSentence.content?.trim() !==
    sentences[sentences.length - 1].content?.trim()
  ) {
    currentSentence.endTime = transcript[transcript.length - 1].endTime;
    sentences.push(currentSentence);
  }

  return sentences;
}

async function generateSubtitles(transcript) {
  const keyframes = [];

  // Usage
  let srtData = createSRTFromTranscript(transcript);

  let counter = 2;

  for (const sentence of srtData) {
    counter++; // Increase the counter at the beginning of each iteration

    // Convert each timestamp in the SRT to seconds
    const startTime = sentence.startTime;
    const endTime = sentence.endTime;

    // Get the words that correspond to this sentence
    const words = transcript.filter(
      (word) => word.startTime >= startTime && word.startTime < endTime
    );

    // Get the entire sentence text
    const sentenceText = words.map((word) => word.content).join(" ");


    console.log({})

    let emoji = "";

    // Get the appropriate emoji for the sentence only if counter is a multiple of 3

    if (counter % 3 === 2) {
      emoji = await getEmojiForText(sentenceText);
      console.log(sentenceText);
      console.log(emoji);
    }

    console.log("HERE ARE THE WORDS", {words});

    // Iterate through each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      let text = "";

      // Encapsulate each spoken word with an RGBA color tag, to make it slightly transparent
      const spokenWords = words.slice(0, i);
      if (spokenWords.length > 0) {
        text += `[color #ffffff]${spokenWords
          .map((word) => word.content)
          .join(" ")}[/color] `;
      }

      // Encapsulate the current spoken word with a color tag to make it fully yellow
      text += `[size 110%][color #ffe900]${word.content}[/color][/size]`;

      // Add the words that have not yet been spoken. As the default 'fillColor' is null,
      // the text will be invisible, but reserve its space in the text element
      const unspokenWords = words.slice(i + 1);
      if (unspokenWords.length) {
        text += ` ${unspokenWords.map((word) => word.content).join(" ")}`;
      }

      // Add the emoji at the end of the sentence
      text = text.replace(/[.,!\^&\*;:{}\-_`~()]/g, "");
      if (emoji !== null && emoji !== "") {
        text += ` ${emoji}`;
      }

      // Create a keyframe for each spoken word
      keyframes.push(new Creatomate.Keyframe(text, word.startTime));
    }
  }
  return {keyframes};
}

async function saveSentences(transcript, videoFile) {
  const srtData = createSRTFromTranscript(transcript);

  const result = [];
  let counter = 2;
  for (const sentence of srtData) {
    counter++;
    let emoji = null;

    if (counter % 3 === 2) {
      emoji = await getEmojiForText(sentence.content);
    }

    result.push({
      ...sentence,
      content: sentence.content + (emoji ? " " + emoji : ""),
    })
  }

  await supabase.from('VideoSentences').insert(result.map((item, order) => ({
    ...item,
    video: videoFile.id,
    user: videoFile.user,
    order
  })));
}

async function applySentencesToVideo(sentences) {
  const keyframes = [];

  for (const sentence of sentences) {
    const startTime = sentence.startTime;
    const endTime = sentence.endTime;
    const sentenceText = sentence.content;

    const words = sentenceText.split(" ");
    let currentStartTime = (+startTime).toFixed(2);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      let text = "";
      const spokenWords = words.slice(0, i);
      if (spokenWords.length > 0) {
        text += `[color #ffffff]${spokenWords.join(" ")}[/color] `;
      }

      text += `[size 110%][color #ffe900]${word}[/color][/size]`;

      const unspokenWords = words.slice(i + 1);
      if (unspokenWords.length) {
        text += ` ${unspokenWords.join(" ")}`;
      }

      text = text.replace(/[.,!\^&\*;:{}\-_`~()]/g, "");

      const currentEndTime = (+currentStartTime + (+endTime - +startTime) / words.length).toFixed(2);
      keyframes.push(new Creatomate.Keyframe(text, +currentEndTime));
      currentStartTime = currentEndTime;
    }
  }

  return {keyframes};
}


module.exports = {
  saveSentences,
  applySentencesToVideo
};
