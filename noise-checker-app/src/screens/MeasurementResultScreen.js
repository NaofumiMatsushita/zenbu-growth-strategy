import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  generateReportSummary,
  compareWithStandard,
  estimateSoundSource,
  getTimeOfDay,
} from '../utils/NoiseAnalyzer';

const screenWidth = Dimensions.get('window').width;

const MeasurementResultScreen = ({ route, navigation }) => {
  const { measurement } = route.params;
  const summary = generateReportSummary(measurement);
  const { noiseLevel, comparison, statistics, soundSources } = summary;

  // グラフ用データの準備
  const chartData = {
    labels: [],
    datasets: [
      {
        data: measurement.dbHistory.length > 0 ? measurement.dbHistory : [0],
        color: (opacity = 1) => noiseLevel.color,
        strokeWidth: 2,
      },
    ],
  };

  // ラベルを間引く（最大10個）
  const labelInterval = Math.max(1, Math.floor(measurement.dbHistory.length / 10));
  for (let i = 0; i < measurement.dbHistory.length; i += labelInterval) {
    chartData.labels.push(`${Math.floor(i / 6)}分`);
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(
      date.getHours()
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー情報 */}
      <View style={styles.headerCard}>
        <View style={styles.dateTimeContainer}>
          <Icon name="access-time" size={22} color="#4fc3f7" />
          <Text style={styles.dateTimeText}>
            {formatDateTime(measurement.startTime)}
          </Text>
        </View>
        <View style={styles.durationContainer}>
          <Icon name="timer" size={22} color="#4fc3f7" />
          <Text style={styles.durationText}>
            測定時間: {formatDuration(measurement.duration)}
          </Text>
        </View>
      </View>

      {/* 判定結果 */}
      <View style={[styles.resultCard, { backgroundColor: noiseLevel.color }]}>
        <Text style={styles.resultIcon}>{noiseLevel.icon}</Text>
        <Text style={styles.resultTitle}>{noiseLevel.label}</Text>
        <View style={styles.dbContainer}>
          <Text style={styles.dbLabel}>最大騒音レベル</Text>
          <Text style={styles.dbValue}>{measurement.maxDb.toFixed(1)} dB</Text>
        </View>
        <Text style={styles.resultDescription}>{noiseLevel.description}</Text>
      </View>

      {/* 詳細データ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>詳細データ</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>最大</Text>
          <Text style={styles.detailValue}>{statistics.max.toFixed(1)} dB</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>平均</Text>
          <Text style={styles.detailValue}>{statistics.average.toFixed(1)} dB</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>最小</Text>
          <Text style={styles.detailValue}>{statistics.min.toFixed(1)} dB</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>中央値</Text>
          <Text style={styles.detailValue}>{statistics.median.toFixed(1)} dB</Text>
        </View>
      </View>

      {/* 時系列グラフ */}
      {measurement.dbHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>時系列グラフ</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 72}
            height={220}
            chartConfig={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backgroundGradientFrom: 'rgba(255, 255, 255, 0.05)',
              backgroundGradientTo: 'rgba(255, 255, 255, 0.05)',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(79, 195, 247, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#4fc3f7',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* 環境基準との比較 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>環境基準との比較</Text>
        <View style={styles.standardContainer}>
          <Text style={styles.standardLabel}>{comparison.standardLabel}</Text>
          <Text style={styles.standardValue}>基準値: {comparison.standard} dB</Text>
        </View>
        <View
          style={[
            styles.standardBadge,
            {
              backgroundColor: comparison.isExceeded ? '#ffebee' : '#e8f5e9',
            },
          ]}
        >
          <Icon
            name={comparison.isExceeded ? 'warning' : 'check-circle'}
            size={24}
            color={comparison.isExceeded ? '#f44336' : '#4caf50'}
          />
          <Text
            style={[
              styles.standardMessage,
              {
                color: comparison.isExceeded ? '#f44336' : '#4caf50',
              },
            ]}
          >
            {comparison.message}
          </Text>
        </View>
      </View>

      {/* 音源推定 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>音源推定（AI）</Text>
        <Text style={styles.cardSubtitle}>
          測定データから騒音の種類を推定しています
        </Text>
        {soundSources.length > 0 ? (
          soundSources.map((source, index) => (
            <View key={index} style={styles.sourceItem}>
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceIcon}>{source.icon}</Text>
                <Text style={styles.sourceName}>{source.type}</Text>
              </View>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${source.confidence * 100}%`,
                      backgroundColor: noiseLevel.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                信頼度: {(source.confidence * 100).toFixed(0)}%
              </Text>
              <Text style={styles.sourceDescription}>{source.description}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>音源を特定できませんでした</Text>
        )}
      </View>

      {/* 推奨アクション */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>推奨アクション</Text>
        <View style={styles.actionContainer}>
          <Icon name="lightbulb-outline" size={24} color="#ff9800" />
          <Text style={styles.actionText}>{summary.recommendation}</Text>
        </View>
      </View>

      {/* アクションボタン */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Report', { measurement })}
        >
          <Icon name="description" size={24} color="#fff" />
          <Text style={styles.buttonText}>レポート生成</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="home" size={24} color="#4fc3f7" />
          <Text style={styles.buttonText}>
            ホームに戻る
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 10,
  },
  resultCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  resultIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 20,
  },
  dbContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dbLabel: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
    marginBottom: 8,
    fontWeight: '600',
  },
  dbValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resultDescription: {
    fontSize: 17,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
  },
  chart: {
    marginVertical: 12,
    borderRadius: 20,
  },
  standardContainer: {
    marginBottom: 16,
  },
  standardLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '600',
  },
  standardValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  standardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  standardMessage: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  sourceItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  sourceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  confidenceBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 5,
    marginVertical: 10,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 5,
  },
  confidenceText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '600',
  },
  sourceDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 183, 77, 0.15)',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 77, 0.3)',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: '#ffb74d',
    marginLeft: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    backgroundColor: '#4fc3f7',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#4fc3f7',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 10,
  },
});

export default MeasurementResultScreen;
