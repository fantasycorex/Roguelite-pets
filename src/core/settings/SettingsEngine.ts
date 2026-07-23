export interface SettingsData {
  masterVolume: number; // 0.0 to 1.0
  isMuted: boolean;
  screenShakeEnabled: boolean;
  reducedMotionEnabled: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  masterVolume: 1.0,
  isMuted: false,
  screenShakeEnabled: true,
  reducedMotionEnabled: false,
};

const SETTINGS_STORAGE_KEY = 'ROGUELITE_PETS_SETTINGS_V1';

export class SettingsEngine {
  private static instance: SettingsEngine;
  private settings: SettingsData;

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): SettingsEngine {
    if (!SettingsEngine.instance) {
      SettingsEngine.instance = new SettingsEngine();
    }
    return SettingsEngine.instance;
  }

  public getSettings(): SettingsData {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<SettingsData>): SettingsData {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    return this.getSettings();
  }

  public isScreenShakeEnabled(): boolean {
    return this.settings.screenShakeEnabled && !this.settings.reducedMotionEnabled;
  }

  public isReducedMotionEnabled(): boolean {
    return this.settings.reducedMotionEnabled;
  }

  private loadSettings(): SettingsData {
    try {
      if (typeof localStorage !== 'undefined') {
        const json = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
}

export const settingsEngine = SettingsEngine.getInstance();
