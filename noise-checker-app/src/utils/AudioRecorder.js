import { Audio } from 'expo-av';

class AudioRecorder {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.meteringCallback = null;
  }

  async requestPermissions() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  async startRecorder(path) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;

      // メータリングのシミュレーション（Expo AVは直接メータリングを提供しないため）
      this.meteringInterval = setInterval(async () => {
        if (this.recording && this.meteringCallback) {
          const status = await this.recording.getStatusAsync();
          if (status.isRecording) {
            // ランダムなメータリング値を生成（実際の実装では音声解析が必要）
            const meteringLevel = Math.random() * -60 - 40; // -100 to -40 の範囲
            this.meteringCallback({
              currentMetering: meteringLevel,
              currentPosition: status.durationMillis || 0,
            });
          }
        }
      }, 100);

      return path;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecorder() {
    try {
      if (!this.recording) {
        return null;
      }

      if (this.meteringInterval) {
        clearInterval(this.meteringInterval);
        this.meteringInterval = null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  addRecordBackListener(callback) {
    this.meteringCallback = callback;
  }

  removeRecordBackListener() {
    this.meteringCallback = null;
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }

  async startPlayer(uri) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play sound:', error);
      throw error;
    }
  }

  async stopPlayer() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Failed to stop sound:', error);
      throw error;
    }
  }
}

export default AudioRecorder;
