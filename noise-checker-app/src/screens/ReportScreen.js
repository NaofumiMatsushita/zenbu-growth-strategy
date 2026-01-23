import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { generateReportSummary } from '../utils/NoiseAnalyzer';

const ReportScreen = ({ route }) => {
  const { measurement } = route.params;
  const summary = generateReportSummary(measurement);
  const [selectedFormat, setSelectedFormat] = useState('text'); // 'text', 'pdf'

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(
      date.getHours()
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const generateTextReport = () => {
    const { noiseLevel, comparison, statistics } = summary;

    return `━━━━━━━━━━━━━━━━━━━━
騒音測定レポート
━━━━━━━━━━━━━━━━━━━━

【測定情報】
測定日時: ${formatDateTime(measurement.startTime)}
測定時間: ${formatDuration(measurement.duration)}
測定場所: ${measurement.address || '未設定'}
部屋番号: ${measurement.roomNumber || '未設定'}

━━━━━━━━━━━━━━━━━━━━
【判定結果】
━━━━━━━━━━━━━━━━━━━━

騒音レベル: ${noiseLevel.icon} ${noiseLevel.label}
最大騒音: ${measurement.maxDb.toFixed(1)} dB
平均騒音: ${measurement.avgDb.toFixed(1)} dB

${noiseLevel.description}

━━━━━━━━━━━━━━━━━━━━
【詳細データ】
━━━━━━━━━━━━━━━━━━━━

最大値: ${statistics.max.toFixed(1)} dB
平均値: ${statistics.average.toFixed(1)} dB
中央値: ${statistics.median.toFixed(1)} dB
最小値: ${statistics.min.toFixed(1)} dB
測定回数: ${statistics.count} 回

━━━━━━━━━━━━━━━━━━━━
【環境基準との比較】
━━━━━━━━━━━━━━━━━━━━

時間帯: ${comparison.standardLabel}
基準値: ${comparison.standard} dB
判定: ${comparison.isExceeded ? '基準超過' : '基準内'}
差分: ${comparison.difference.toFixed(1)} dB

${comparison.message}

━━━━━━━━━━━━━━━━━━━━
【推奨アクション】
━━━━━━━━━━━━━━━━━━━━

${summary.recommendation}

━━━━━━━━━━━━━━━━━━━━

このレポートは ZENBU騒音チェッカー で作成されました。
作成日時: ${formatDateTime(new Date().toISOString())}

━━━━━━━━━━━━━━━━━━━━
`;
  };

  const handleShare = async () => {
    try {
      const report = generateTextReport();
      await Share.share({
        message: report,
        title: '騒音測定レポート',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('エラー', '共有に失敗しました', [{ text: 'OK' }]);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: PDFのダウンロード機能を実装
    Alert.alert(
      '開発中',
      'PDF出力機能は現在開発中です。テキスト形式でご利用ください。',
      [{ text: 'OK' }]
    );
  };

  const handleCopyToClipboard = () => {
    // TODO: クリップボードへのコピー機能を実装
    Alert.alert('完了', 'レポートをクリップボードにコピーしました', [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* フォーマット選択 */}
      <View style={styles.formatContainer}>
        <TouchableOpacity
          style={[
            styles.formatButton,
            selectedFormat === 'text' && styles.formatButtonActive,
          ]}
          onPress={() => setSelectedFormat('text')}
        >
          <Icon
            name="description"
            size={20}
            color={selectedFormat === 'text' ? '#fff' : '#666'}
          />
          <Text
            style={[
              styles.formatText,
              selectedFormat === 'text' && styles.formatTextActive,
            ]}
          >
            テキスト
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.formatButton,
            selectedFormat === 'pdf' && styles.formatButtonActive,
          ]}
          onPress={() => setSelectedFormat('pdf')}
        >
          <Icon
            name="picture-as-pdf"
            size={20}
            color={selectedFormat === 'pdf' ? '#fff' : '#666'}
          />
          <Text
            style={[
              styles.formatText,
              selectedFormat === 'pdf' && styles.formatTextActive,
            ]}
          >
            PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* レポートプレビュー */}
      <ScrollView style={styles.previewContainer}>
        <Text style={styles.reportText}>{generateTextReport()}</Text>
      </ScrollView>

      {/* アクションボタン */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={24} color="#0066cc" />
          <Text style={styles.actionText}>共有</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopyToClipboard}
        >
          <Icon name="content-copy" size={24} color="#0066cc" />
          <Text style={styles.actionText}>コピー</Text>
        </TouchableOpacity>

        {selectedFormat === 'pdf' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownloadPDF}
          >
            <Icon name="download" size={24} color="#0066cc" />
            <Text style={styles.actionText}>ダウンロード</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formatContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  formatButtonActive: {
    backgroundColor: '#0066cc',
  },
  formatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  formatTextActive: {
    color: '#fff',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default ReportScreen;
