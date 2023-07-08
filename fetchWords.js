async function fetchWords(jobData) {

  const words = [];

  let transcript = [];
  let lastEndTime = 0;

  const segments = jobData.output.segments;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const words = segment.words;

    for (let j = 0; j < words.length; j++) {
      const word = words[j];
      // remove the leading space
      word.word = word.word.trim();
      // If the word starts with apostrophe, merge it with the previous word without space
      if (word.word.startsWith("'") && transcript.length > 0) {
        const lastWord = transcript[transcript.length - 1];
        lastWord.word += word.word;
        lastWord.end = word.end; // Update the end time of the merged word
      }
      // If the word has the same end time as the previous word, merge them
      else if ((transcript.length > 0 && word.end === transcript[transcript.length - 1].end)) {
        const lastWord = transcript[transcript.length - 1];
        lastWord.word += ' ' + word.word;
        lastWord.end = word.end; // Update the end time of the merged word
      } else {
        transcript.push(word);
      }
    }

    // update the last end time
    if (segment.end > lastEndTime) {
      lastEndTime = segment.end;
    }
  }

  // Iterate through each transcription item
  for (const word of transcript) {

    // The word or punctuation that was transcribed
    const content = word.word;

    if (word.type === 'punctuation') {

      // Append punctuations to the last word
      const lastWord = words[words.length - 1];
      if (lastWord) {
        lastWord.content += content;
      }

    } else {

      // Add the spoken word to the transcript, parsing the start and end time
      words.push({
        startTime: parseFloat(word.start),
        endTime: parseFloat(word.end),
        content,
      });
    }
  }

  return words;
}

module.exports = fetchWords;
