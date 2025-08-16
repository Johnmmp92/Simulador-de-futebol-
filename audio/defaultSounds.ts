// This file provides placeholder sound data to prevent application errors on startup.
// A silent WAV file is used as a default for all audio events.
// The user can replace these sounds through the in-app settings.
const silentSound = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export const defaultSounds = {
  stadiumAmbiance: silentSound,
  ballTouch: silentSound,
  goal: silentSound,
  wallHit: silentSound,
  buffPickup: silentSound,
  goalCheer: silentSound,
  matchStart: silentSound,
  halfTime: silentSound,
  secondHalfStart: silentSound,
  matchEnd: silentSound,
};
