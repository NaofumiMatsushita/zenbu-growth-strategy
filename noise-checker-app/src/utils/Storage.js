import AsyncStorage from '@react-native-async-storage/async-storage';

const MEASUREMENTS_KEY = '@noise_checker:measurements';
const SETTINGS_KEY = '@noise_checker:settings';

/**
 * 測定データを保存
 * @param {Object} measurement - 測定データ
 */
export async function saveMeasurement(measurement) {
  try {
    const existing = await getAllMeasurements();
    const updated = [measurement, ...existing];
    await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Save measurement error:', error);
    return false;
  }
}

/**
 * すべての測定データを取得
 * @returns {Array<Object>} 測定データの配列
 */
export async function getAllMeasurements() {
  try {
    const data = await AsyncStorage.getItem(MEASUREMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Get measurements error:', error);
    return [];
  }
}

/**
 * 特定の測定データを取得
 * @param {string} id - 測定ID
 * @returns {Object|null} 測定データ
 */
export async function getMeasurementById(id) {
  try {
    const measurements = await getAllMeasurements();
    return measurements.find((m) => m.id === id) || null;
  } catch (error) {
    console.error('Get measurement by ID error:', error);
    return null;
  }
}

/**
 * 測定データを削除
 * @param {string} id - 測定ID
 */
export async function deleteMeasurement(id) {
  try {
    const measurements = await getAllMeasurements();
    const filtered = measurements.filter((m) => m.id !== id);
    await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Delete measurement error:', error);
    return false;
  }
}

/**
 * すべての測定データを削除
 */
export async function clearAllMeasurements() {
  try {
    await AsyncStorage.removeItem(MEASUREMENTS_KEY);
    return true;
  } catch (error) {
    console.error('Clear measurements error:', error);
    return false;
  }
}

/**
 * 設定を保存
 * @param {Object} settings - 設定データ
 */
export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Save settings error:', error);
    return false;
  }
}

/**
 * 設定を取得
 * @returns {Object} 設定データ
 */
export async function getSettings() {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data
      ? JSON.parse(data)
      : {
          name: '',
          address: '',
          roomNumber: '',
          areaType: 'residential', // 'residential' or 'commercial'
          autoRecord: true,
          recordThreshold: 60,
          notificationEnabled: true,
        };
  } catch (error) {
    console.error('Get settings error:', error);
    return {};
  }
}

/**
 * 測定データの統計情報を取得
 * @returns {Object} 統計情報
 */
export async function getMeasurementStats() {
  try {
    const measurements = await getAllMeasurements();

    if (measurements.length === 0) {
      return {
        total: 0,
        averageDb: 0,
        maxDb: 0,
        noiseCount: 0,
        lastMeasurement: null,
      };
    }

    const avgDbSum = measurements.reduce((sum, m) => sum + m.avgDb, 0);
    const maxDbOverall = Math.max(...measurements.map((m) => m.maxDb));
    const noiseCount = measurements.filter((m) => m.maxDb >= 60).length;

    return {
      total: measurements.length,
      averageDb: (avgDbSum / measurements.length).toFixed(1),
      maxDb: maxDbOverall.toFixed(1),
      noiseCount,
      lastMeasurement: measurements[0],
    };
  } catch (error) {
    console.error('Get measurement stats error:', error);
    return null;
  }
}

/**
 * 期間を指定して測定データを取得
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @returns {Array<Object>} 測定データの配列
 */
export async function getMeasurementsByDateRange(startDate, endDate) {
  try {
    const measurements = await getAllMeasurements();
    return measurements.filter((m) => {
      const measurementDate = new Date(m.startTime);
      return measurementDate >= startDate && measurementDate <= endDate;
    });
  } catch (error) {
    console.error('Get measurements by date range error:', error);
    return [];
  }
}

/**
 * dB値で測定データをフィルタ
 * @param {number} minDb - 最小dB
 * @param {number} maxDb - 最大dB
 * @returns {Array<Object>} 測定データの配列
 */
export async function getMeasurementsByDbRange(minDb, maxDb) {
  try {
    const measurements = await getAllMeasurements();
    return measurements.filter((m) => m.maxDb >= minDb && m.maxDb <= maxDb);
  } catch (error) {
    console.error('Get measurements by dB range error:', error);
    return [];
  }
}
