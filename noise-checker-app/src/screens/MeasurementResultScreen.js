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
          <Icon name="access-time" size={20} color="#666" />
          <Text style={styles.dateTimeText}>
            {formatDateTime(measurement.startTime)}
          </Text>
        </View>
        <View style={styles.durationContainer}>
          <Icon name="timer" size={20} color="#666" />
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
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: noiseLevel.color,
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
          <Icon name="home" size={24} color="#0066cc" />
          <Text style={[styles.buttonText, { color: '#0066cc' }]}>
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
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  resultCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 1,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  dbContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dbLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  dbValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultDescription: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  standardContainer: {
    marginBottom: 12,
  },
  standardLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  standardValue: {
    fontSize: 14,
    color: '#999',
  },
  standardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  standardMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sourceItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sourceDescription: {
    fontSize: 14,
    color: '#999',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default MeasurementResultScreen;
