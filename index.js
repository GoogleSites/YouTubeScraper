const axios = require('axios');
const entities = new (require('html-entities').XmlEntities);

const GET_CHANNELS_REGEX = /src="\/\/([^"]+).*?href="([^"]+).*?"ltr">([^<]+).*?<li>([^ ]+).*?"ltr">([^<]+).*?external-id="([^"]+)/gs;
const GET_CHANNEL_VIDEOS_REGEX = /thumb="([^"]+).*?>([^<]+)<\/span><.*?r" title="([^"]+).*?href="\/watch\?v=([^"]+).*?<li>([^<]+)<\/li><li>([^ ]+).*?"ltr">\s+([^<]+)/gs;
const GET_ALL_VIDEOS_REGEX = /href="\/watch\?v=([^"]+).*?data-thumb="([^"]+).*?>([^<]+)<\/.*?  title="([^"]+).*?href="\/channel\/([^"]+).*? >([^<]+).*?<li>([^<]+)<\/li><li>([^ ]+).*?"ltr">(.+?)<li>/gs;

function parseTime(time) {
  const times = time.split(':').map(t => Number.parseInt(t));

  if (times.length === 3) return times[2] + times[1] * 60 + times[0] * 3600;
  return times[1] + times[0] * 60;
}

// Returns an array of channel IDs & channel names
async function getChannels(name) {
  const { data: html } = await axios.get(`https://www.youtube.com/results?search_query=${name}&sp=EgIQAg==`);
  
  return [...html.matchAll(GET_CHANNELS_REGEX)]
    .map(m => ({
      id: m[6],
      name: entities.decode(m[3]),
      url: `https://www.youtube.com${m[2]}`,
      thumbnail: `https://${m[1]}`,
      videos: Number.parseInt(m[4].replace(/,/g, '')),
      description: entities.decode(m[5])
  }));
}

// Returns an array of video IDs and titles
async function searchChannelVideos(id, query) {
  const { data: html } = await axios.get(`https://www.youtube.com/channel/${id}/search?query=${query}`);

  return [...html.matchAll(GET_CHANNEL_VIDEOS_REGEX)]
    .map(m => ({
      id: m[4],
      title: entities.decode(m[3]),
      url: `https://youtube.com/watch?v=${m[4]}`,
      thumbnail: `https://${m[1]}`,
      length: parseTime(m[2]),
      published: m[5],
      views: Number.parseInt(m[6].replace(/,/g, '')),
      description: entities.decode(m[7])
    }));
}

// Returns an array of video IDs and titles
async function getVideos(query) {
  const { data: html } = await axios.get(`https://www.youtube.com/results?search_query=${query}&sp=EgIQAQ==`);

  return [...html.matchAll(GET_ALL_VIDEOS_REGEX)]
    .map(m => ({
      id: m[1],
      title: entities.decode(m[4]),
      url: `https://youtube.com/watch?v=${m[1]}`,
      thumbnail: m[2],
      length: parseTime(m[3]),
      published: m[7],
      views: Number.parseInt(m[8].replace(/,/g, '')),
      description: entities.decode(m[9].replace(/<\/?b>/g, '**')).replace(/<a href="[^"]+.*?>[^<]+<\/a>/gs, match => {
        const [, title, url ] = match.match(/<a href="([^"]+).*?>([^<]+)<\/a>/);
        return `[${title}](${url})`;
      }).match(/^[^<]+/)[0],
      channel: {
        id: m[5],
        name: entities.decode(m[6])
      }
    }));
}

// Main function to test the functions
async function run() {
  const videos = await getVideos('hello');
  const channels = await getChannels('pewdiepie');
  const channelVideos = await searchChannelVideos(channels[0].id, 'hello');

  console.log(videos, channels, channelVideos);
}

run();
