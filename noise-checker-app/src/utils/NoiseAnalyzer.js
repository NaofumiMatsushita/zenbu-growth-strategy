/**
 * NoiseAnalyzer - 騒音分析ユーティリティ
 * 音声データからdB値を計算し、騒音レベルを判定
 */

export const NOISE_LEVELS = {
  QUIET: {
    key: 'quiet',
    label: '静か',
    minDb: 0,
    maxDb: 40,
    color: '#4CAF50', // 緑
    icon: '🟢',
    description: '問題ありません',
    action: '特に対策は不要です',
  },
  MODERATE: {
    key: 'moderate',
    label: 'やや騒音',
    minDb: 40,
    maxDb: 60,
    color: '#FFC107', // 黄
    icon: '🟡',
    description: '注意レベル',
    action: '気になる場合は管理会社への相談を検討してください',
  },
  NOISY: {
    key: 'noisy',
    label: '騒音',
    minDb: 60,
    maxDb: 80,
    color: '#FF9800', // オレンジ
    icon: '🟠',
    description: '要対策レベル',
    action: '管理会社への連絡を推奨します',
  },
  SEVERE: {
    key: 'severe',
    label: '著しい騒音',
    minDb: 80,
    maxDb: 150,
    color: '#F44336', // 赤
    icon: '🔴',
    description: '即対応必要',
    action: '即座に管理会社へ連絡してください',
  },
};

// 環境基準
export const ENVIRONMENTAL_STANDARDS = {
  DAY: {
    label: '昼間（6-22時）',
    residential: 55, // 住居地域
    commercial: 60, // 商業地域
  },
  NIGHT: {
    label: '夜間（22-6時）',
    residential: 45, // 住居地域
    commercial: 50, // 商業地域
  },
};

/**
 * メータリング値からdBを計算
 * @param {number} meteringLevel - メータリング値（-160 to 0）
 * @returns {number} dB値
 */
export function calculateDb(meteringLevel) {
  // メータリング値は通常 -160dB から 0dB の範囲
  // 実際の騒音レベルに変換（簡易計算）
  // 実際の実装では、より正確なキャリブレーションが必要
  const normalizedDb = meteringLevel + 160; // 0-160の範囲に正規化
  const adjustedDb = normalizedDb * 0.625; // 0-100dBの範囲に調整
  return Math.round(adjustedDb * 10) / 10; // 小数点第1位まで
}

/**
 * dB値から騒音レベルを判定
 * @param {number} db - dB値
 * @returns {Object} 騒音レベル情報
 */
export function determineNoiseLevel(db) {
  if (db < NOISE_LEVELS.MODERATE.minDb) {
    return NOISE_LEVELS.QUIET;
  } else if (db < NOISE_LEVELS.NOISY.minDb) {
    return NOISE_LEVELS.MODERATE;
  } else if (db < NOISE_LEVELS.SEVERE.minDb) {
    return NOISE_LEVELS.NOISY;
  } else {
    return NOISE_LEVELS.SEVERE;
  }
}

/**
 * 時間帯を判定
 * @param {Date} date - 日時
 * @returns {string} 'day' or 'night'
 */
export function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 22 ? 'day' : 'night';
}

/**
 * 環境基準との比較
 * @param {number} db - 測定dB値
 * @param {Date} date - 測定日時
 * @param {string} areaType - 地域種別 ('residential' or 'commercial')
 * @returns {Object} 比較結果
 */
export function compareWithStandard(db, date = new Date(), areaType = 'residential') {
  const timeOfDay = getTimeOfDay(date);
  const standard = ENVIRONMENTAL_STANDARDS[timeOfDay.toUpperCase()];
  const standardDb = standard[areaType];
  const difference = db - standardDb;
  const isExceeded = difference > 0;

  return {
    standard: standardDb,
    difference: Math.abs(difference),
    isExceeded,
    timeOfDay,
    standardLabel: standard.label,
    message: isExceeded
      ? `環境基準を${Math.abs(difference).toFixed(1)}dB超過しています`
      : `環境基準内です（${Math.abs(difference).toFixed(1)}dB以下）`,
  };
}

/**
 * 統計情報の計算
 * @param {Array<number>} dbValues - dB値の配列
 * @returns {Object} 統計情報
 */
export function calculateStatistics(dbValues) {
  if (!dbValues || dbValues.length === 0) {
    return {
      max: 0,
      min: 0,
      average: 0,
      median: 0,
      count: 0,
    };
  }

  const sorted = [...dbValues].sort((a, b) => a - b);
  const sum = dbValues.reduce((acc, val) => acc + val, 0);
  const average = sum / dbValues.length;
  const median =
    dbValues.length % 2 === 0
      ? (sorted[dbValues.length / 2 - 1] + sorted[dbValues.length / 2]) / 2
      : sorted[Math.floor(dbValues.length / 2)];

  return {
    max: Math.max(...dbValues),
    min: Math.min(...dbValues),
    average: Math.round(average * 10) / 10,
    median: Math.round(median * 10) / 10,
    count: dbValues.length,
  };
}

/**
 * 音源を推定（簡易版）
 * 実際のAI実装では、機械学習モデルを使用
 * @param {number} db - dB値
 * @param {string} timeOfDay - 時間帯
 * @returns {Array<Object>} 推定音源リスト
 */
export function estimateSoundSource(db, timeOfDay) {
  const sources = [];

  // dBレベルに基づく簡易推定
  if (db >= 70) {
    sources.push({
      type: '足音・歩行音',
      icon: '🚶',
      confidence: 0.75,
      description: '上階または隣室からの足音の可能性が高い',
    });
  }

  if (db >= 60 && db < 75) {
    sources.push({
      type: '人の声・会話',
      icon: '🗣️',
      confidence: 0.65,
      description: '隣室または外部からの話し声',
    });
  }

  if (db >= 65 && timeOfDay === 'day') {
    sources.push({
      type: '家電・生活音',
      icon: '🔧',
      confidence: 0.60,
      description: '掃除機、洗濯機などの家電音',
    });
  }

  if (db >= 80) {
    sources.push({
      type: 'ドアの開閉音',
      icon: '🚪',
      confidence: 0.55,
      description: '強いドアの開閉音',
    });
  }

  if (timeOfDay === 'night' && db >= 60) {
    sources.push({
      type: 'テレビ・音楽',
      icon: '📺',
      confidence: 0.70,
      description: 'テレビや音楽の音量が大きい可能性',
    });
  }

  // 信頼度順にソート
  sources.sort((a, b) => b.confidence - a.confidence);

  return sources;
}

/**
 * レポート用のサマリーを生成
 * @param {Object} measurement - 測定データ
 * @returns {Object} レポートサマリー
 */
export function generateReportSummary(measurement) {
  const { maxDb, avgDb, minDb, startTime, duration, dbHistory } = measurement;
  const noiseLevel = determineNoiseLevel(maxDb);
  const comparison = compareWithStandard(maxDb, new Date(startTime));
  const statistics = calculateStatistics(dbHistory);
  const timeOfDay = getTimeOfDay(new Date(startTime));
  const soundSources = estimateSoundSource(maxDb, timeOfDay);

  return {
    measurement: {
      maxDb,
      avgDb,
      minDb,
      startTime,
      duration,
    },
    noiseLevel,
    comparison,
    statistics,
    soundSources,
    recommendation: generateRecommendation(noiseLevel, comparison),
  };
}

/**
 * 推奨アクションを生成
 * @param {Object} noiseLevel - 騒音レベル
 * @param {Object} comparison - 環境基準との比較
 * @returns {string} 推奨アクション
 */
function generateRecommendation(noiseLevel, comparison) {
  let recommendation = noiseLevel.action;

  if (comparison.isExceeded) {
    recommendation += '\n\n';
    recommendation += `環境基準（${comparison.standardLabel}）を${comparison.difference.toFixed(
      1
    )}dB超過しています。`;
    recommendation += '\n測定データを管理会社に提示することで、客観的な証拠となります。';
  }

  if (noiseLevel.key === 'severe') {
    recommendation += '\n\n';
    recommendation += '⚠️ 著しい騒音レベルです。継続的な測定と記録を推奨します。';
  }

  return recommendation;
}

/**
 * 録音ファイル名を生成
 * @param {Date} date - 日時
 * @returns {string} ファイル名
 */
export function generateRecordingFileName(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `noise_${year}${month}${day}_${hours}${minutes}${seconds}.m4a`;
}
