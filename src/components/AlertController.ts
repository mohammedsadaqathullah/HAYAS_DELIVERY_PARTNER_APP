import TrackPlayer, { State, Capability } from 'react-native-track-player';

let isSetup = false;

export const setupAudio = async () => {
  if (isSetup) return;

  await TrackPlayer.setupPlayer();

  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.Stop,
    ],
  });

  await TrackPlayer.add({
    id: '1',
    // url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    url:require('../assets/alert.mp3'),
    title: 'Online Track',
    artist: 'SoundHelix',
    artwork: 'https://dummyimage.com/300.png/09f/fff', // optional
  });

  isSetup = true;
};

export const playAudio = async () => {
  // Always seek to the beginning before playing
  await TrackPlayer.seekTo(0);
  const state = await TrackPlayer.getState();
  if (state !== State.Playing) {
    await TrackPlayer.play();
  }
};

export const pauseAudio = async () => {
  const state = await TrackPlayer.getState();
  if (state === State.Playing) {
    await TrackPlayer.pause();
  }
};

export const stopAudio = async () => {
  await TrackPlayer.stop();
  isSetup = false;
};
