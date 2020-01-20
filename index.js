const axios = require('axios');
const entities = new (require('html-entities').XmlEntities);

// Returns an array of channel IDs & channel names
async function getChannels(name) {
  const { data: html } = await axios.get(`https://www.youtube.com/results?search_query=${name}&sp=EgIQAg==`);
  return [...html.matchAll(/data-sessionlink="[^"]+"  title="([^"]+)" aria-describedby=.*?data-channel-external-id="([^"]+)"/gs)].map(m => ({ name: entities.decode(m[1]), id: m[2] }));
}

// Returns an array of video IDs and titles
async function searchChannelVideos(id, query) {
  const { data: html } = await axios.get(`https://www.youtube.com/channel/${id}/search?query=${query}`);
  return [...html.matchAll(/href="\/watch\?v=([^"]+)" rel="nofollow">([^<]+)</g)].map(m => ({ id: m[1], title: entities.decode(m[2]) }));
}

// Returns an array of video IDs and titles
async function getVideos(query) {
  const { data: html } = await axios.get(`https://www.youtube.com/results?search_query=${query}`);
  return [...html.matchAll(/<a href="\/watch\?v=([^"]+)".*?title="([^"]+)"/gs)].map(m => ({ id: m[1], title: entities.decode(m[2]) }));
}

// Main function to test the functions
async function run() {
  const allVideos = await getVideos('hello'); // Searches all of YouTube & not just a certain channel.
  const channels = await getChannels('pewdiepie'); // Returns an array of channels.
  const videos = await searchChannelVideos(channels[0].id, 'hello'); // Searches videos on PewDiePie's channel.
}

run();
