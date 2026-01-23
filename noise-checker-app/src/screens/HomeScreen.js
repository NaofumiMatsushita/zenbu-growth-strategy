import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  calculateDb,
  determineNoiseLevel,
  generateRecordingFileName,
} from '../utils/NoiseAnalyzer';
import { saveMeasurement } from '../utils/Storage';

const audioRecorderPlayer = new AudioRecorderPlayer();

const HomeScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [maxDb, setMaxDb] = useState(0);
  const [minDb, setMinDb] = useState(100);
  const [avgDb, setAvgDb] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dbHistory, setDbHistory] = useState([]);
  const [recordingPath, setRecordingPath] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const noiseLevel = determineNoiseLevel(currentDb);

  useEffect(() => {
    requestMicrophonePermission();
    return () => {
      stopRecording();
    };
  }, []);

  // dB値のアニメーション
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1 + currentDb / 300,
        useNativeDriver: true,
        friction: 3,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.7 + (currentDb / 200),
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentDb]);

  const requestMicrophonePermission = async () => {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(permission);

      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          '権限が必要です',
          'マイクへのアクセスが許可されていません。設定から許可してください。',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const startRecording = async () => {
    try {
      const path = generateRecordingFileName();
      setRecordingPath(path);
      setDbHistory([]);
      setMaxDb(0);
      setMinDb(100);
      setDuration(0);

      await audioRecorderPlayer.startRecorder(path);

      audioRecorderPlayer.addRecordBackListener((e) => {
        const db = calculateDb(e.currentMetering);
        setCurrentDb(db);
        setDuration(Math.floor(e.currentPosition / 1000));

        // 履歴に追加
        setDbHistory((prev) => [...prev, db]);

        // 最大・最小・平均を更新
        setMaxDb((prevMax) => Math.max(prevMax, db));
        setMinDb((prevMin) => Math.min(prevMin, db));
      });

      setIsRecording(true);
    } catch (error) {
      console.error('Recording start error:', error);
      Alert.alert('エラー', '測定を開始できませんでした', [{ text: 'OK' }]);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);

      // 平均dBを計算
      const avg =
        dbHistory.reduce((sum, db) => sum + db, 0) / dbHistory.length || 0;
      setAvgDb(Math.round(avg * 10) / 10);

      // 測定データを保存
      const measurement = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        duration,
        maxDb,
        avgDb: Math.round(avg * 10) / 10,
        minDb,
        dbHistory,
        recordingPath: result,
        location: '', // TODO: 位置情報の追加
        roomNumber: '', // TODO: 設定から取得
      };

      await saveMeasurement(measurement);

      // 結果画面へ遷移
      navigation.navigate('MeasurementResult', { measurement });
    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert('エラー', '測定を停止できませんでした', [{ text: 'OK' }]);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isRecording ? '測定中...' : '騒音測定'}
        </Text>
        {isRecording && (
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        )}
      </View>

      <View style={styles.meterContainer}>
        <Animated.View
          style={[
            styles.dbCircle,
            {
              backgroundColor: noiseLevel.color,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.dbValue}>{currentDb.toFixed(1)}</Text>
          <Text style={styles.dbUnit}>dB</Text>
        </Animated.View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelIcon}>{noiseLevel.icon}</Text>
          <Text style={styles.levelText}>{noiseLevel.label}</Text>
        </View>
      </View>

      {isRecording && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>最大</Text>
            <Text style={styles.statValue}>{maxDb.toFixed(1)} dB</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>最小</Text>
            <Text style={styles.statValue}>{minDb.toFixed(1)} dB</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>平均</Text>
            <Text style={styles.statValue}>
              {(dbHistory.reduce((sum, db) => sum + db, 0) / dbHistory.length || 0).toFixed(1)} dB
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isRecording ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startRecording}
          >
            <Icon name="mic" size={40} color="#fff" />
            <Text style={styles.buttonText}>測定開始</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopRecording}
          >
            <Icon name="stop" size={40} color="#fff" />
            <Text style={styles.buttonText}>測定停止</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Icon name="info-outline" size={22} color="rgba(255, 255, 255, 0.7)" />
        <Text style={styles.infoText}>
          {isRecording
            ? '周囲の騒音レベルをリアルタイムで測定中です'
            : 'マイクボタンを押して測定を開始してください'}
        </Text>
      </View>

      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>騒音レベルの目安</Text>
        <View style={styles.guideItem}>
          <Text style={styles.guideIcon}>🟢</Text>
          <Text style={styles.guideText}>0-40dB: 静か（図書館程度）</Text>
        </View>
        <View style={styles.guideItem}>
          <Text style={styles.guideIcon}>🟡</Text>
          <Text style={styles.guideText}>40-60dB: やや騒音（普通の会話）</Text>
        </View>
        <View style={styles.guideItem}>
          <Text style={styles.guideIcon}>🟠</Text>
          <Text style={styles.guideText}>60-80dB: 騒音（交通騒音）</Text>
        </View>
        <View style={styles.guideItem}>
          <Text style={styles.guideIcon}>🔴</Text>
          <Text style={styles.guideText}>80dB以上: 著しい騒音</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  durationText: {
    fontSize: 20,
    color: '#4fc3f7',
    marginTop: 8,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  meterContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  dbCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dbValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dbUnit: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  levelIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  levelText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 32,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  startButton: {
    backgroundColor: '#4fc3f7',
  },
  stopButton: {
    backgroundColor: '#ef5350',
  },
  buttonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  guideContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  guideIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  guideText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});

export default HomeScreen;
