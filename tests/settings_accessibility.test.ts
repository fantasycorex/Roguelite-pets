import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsEngine, DEFAULT_SETTINGS } from '../src/core/settings/SettingsEngine';
import { SoundEngine } from '../src/core/audio/SoundEngine';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Milestone 14 — Settings & Accessibility Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('loads default settings when storage is empty', () => {
    const engine = SettingsEngine.getInstance();
    const settings = engine.getSettings();

    expect(settings.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
    expect(settings.isMuted).toBe(false);
    expect(settings.screenShakeEnabled).toBe(true);
    expect(settings.reducedMotionEnabled).toBe(false);
  });

  it('updates settings and persists payload to storage', () => {
    const engine = SettingsEngine.getInstance();
    engine.updateSettings({ masterVolume: 0.5, screenShakeEnabled: false });

    const updated = engine.getSettings();
    expect(updated.masterVolume).toBe(0.5);
    expect(updated.screenShakeEnabled).toBe(false);
  });

  it('disables screen shake automatically when reduced motion is enabled', () => {
    const engine = SettingsEngine.getInstance();
    engine.updateSettings({ screenShakeEnabled: true, reducedMotionEnabled: true });

    expect(engine.isReducedMotionEnabled()).toBe(true);
    expect(engine.isScreenShakeEnabled()).toBe(false);
  });

  it('SoundEngine scales master volume level accurately', () => {
    const sound = SoundEngine.getInstance();
    sound.setVolume(0.7);
    expect(sound.getVolume()).toBe(0.7);

    sound.setVolume(1.5); // Should cap at 1.0
    expect(sound.getVolume()).toBe(1.0);
  });
});
