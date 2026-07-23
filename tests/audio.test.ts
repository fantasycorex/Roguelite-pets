import { describe, it, expect } from 'vitest';
import { soundEngine } from '../src/core/audio/SoundEngine';

describe('SoundEngine Unit Tests', () => {
  it('initializes in unmuted state by default', () => {
    expect(soundEngine.isMuted()).toBe(false);
  });

  it('toggles mute status correctly', () => {
    const isMuted = soundEngine.toggleMute();
    expect(isMuted).toBe(true);
    expect(soundEngine.isMuted()).toBe(true);

    const isUnmuted = soundEngine.toggleMute();
    expect(isUnmuted).toBe(false);
    expect(soundEngine.isMuted()).toBe(false);
  });
});
