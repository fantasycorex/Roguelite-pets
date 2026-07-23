import { settingsEngine, SettingsData } from '../settings/SettingsEngine';
import { soundEngine } from '../audio/SoundEngine';

export class SettingsCoordinator {
  public static syncAudioOnStartup(): void {
    const settings = settingsEngine.getSettings();
    soundEngine.setVolume(settings.masterVolume);
    if (settings.isMuted !== soundEngine.isMuted()) {
      soundEngine.toggleMute();
    }
  }

  public static updateMasterVolume(newVolume: number): SettingsData {
    soundEngine.setVolume(newVolume);
    return settingsEngine.updateSettings({ masterVolume: newVolume });
  }

  public static toggleAudioMute(): SettingsData {
    const isMuted = soundEngine.toggleMute();
    return settingsEngine.updateSettings({ isMuted });
  }

  public static toggleScreenShake(): SettingsData {
    const current = settingsEngine.getSettings().screenShakeEnabled;
    return settingsEngine.updateSettings({ screenShakeEnabled: !current });
  }

  public static toggleReducedMotion(): SettingsData {
    const current = settingsEngine.getSettings().reducedMotionEnabled;
    return settingsEngine.updateSettings({ reducedMotionEnabled: !current });
  }
}
