const Creatomate = require('creatomate');

const client = new Creatomate.Client('7d1a901364404d2483b21dbff35039a1d0ea492b817d14593279a563dd420d093cfe7e3aa9a809090c15a957cbefc27f');

async function applySubtitleOnVideo(mediaUri, subtitleKeyframes) {
  const source = new Creatomate.Source({
    outputFormat: 'mp4',
    emojiStyle: 'apple', // Choose between 'facebook', 'google', 'twitter', or 'apple'
    width: 1080,
    height: 1920,

    elements: [
      // The video file. Since we do not specify a duration, the length of the video element
      // is determined by the video file provided
      new Creatomate.Video({
        source: mediaUri,
      }),

      // The subtitles
      new Creatomate.Text({
        // Make the subtitle container as large as the screen with some padding
        width: '100%',
        height: '100%',
        xPadding: '8 vmin',
        yPadding: '8 vmin',

        // Align text to bottom center
        xAlignment: '50%',
        yAlignment: '75%',

        // Text style – note that the default fill color is null (transparent)
        fontWeight: '900',
        fontSize: '3.5 vh',
        fillColor: '#ffffff',
        shadowColor: 'rgba(0,0,0,0.85)',
        shadowBlur: '2 vmin',
        stroke: new Creatomate.Stroke('black', '1 vmin'),
        fontFamily: 'Montserrat',
        text: subtitleKeyframes,
        textTransform: 'uppercase'
      }),

    ],
  });

  // Render the video
  return await client.render({source});
}

module.exports = applySubtitleOnVideo;
