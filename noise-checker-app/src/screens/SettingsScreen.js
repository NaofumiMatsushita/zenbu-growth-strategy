import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getSettings, saveSettings, clearAllMeasurements } from '../utils/Storage';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    name: '',
    address: '',
    roomNumber: '',
    areaType: 'residential',
    autoRecord: true,
    recordThreshold: 60,
    notificationEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      Alert.alert('保存完了', '設定を保存しました', [{ text: 'OK' }]);
    } else {
      Alert.alert('エラー', '設定の保存に失敗しました', [{ text: 'OK' }]);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'データ削除',
      'すべての測定データを削除します。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllMeasurements();
            if (success) {
              Alert.alert('完了', '測定データを削除しました', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* ユーザー情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ユーザー情報</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>氏名</Text>
          <TextInput
            style={styles.input}
            value={settings.name}
            onChangeText={(value) => setSettings({ ...settings, name: value })}
            placeholder="山田 太郎"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>住所</Text>
          <TextInput
            style={styles.input}
            value={settings.address}
            onChangeText={(value) => setSettings({ ...settings, address: value })}
            placeholder="東京都渋谷区..."
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>部屋番号</Text>
          <TextInput
            style={styles.input}
            value={settings.roomNumber}
            onChangeText={(value) =>
              setSettings({ ...settings, roomNumber: value })
            }
            placeholder="302"
          />
        </View>
      </View>

      {/* 地域設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>地域種別</Text>
        <Text style={styles.sectionDescription}>
          環境基準の判定に使用されます
        </Text>

        <TouchableOpacity
          style={[
            styles.radioItem,
            settings.areaType === 'residential' && styles.radioItemActive,
          ]}
          onPress={() => setSettings({ ...settings, areaType: 'residential' })}
        >
          <View style={styles.radioCircle}>
            {settings.areaType === 'residential' && (
              <View style={styles.radioInner} />
            )}
          </View>
          <View style={styles.radioContent}>
            <Text style={styles.radioTitle}>住居地域</Text>
            <Text style={styles.radioDescription}>
              主に住宅が立ち並ぶ地域（基準: 昼55dB/夜45dB）
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioItem,
            settings.areaType === 'commercial' && styles.radioItemActive,
          ]}
          onPress={() => setSettings({ ...settings, areaType: 'commercial' })}
        >
          <View style={styles.radioCircle}>
            {settings.areaType === 'commercial' && (
              <View style={styles.radioInner} />
            )}
          </View>
          <View style={styles.radioContent}>
            <Text style={styles.radioTitle}>商業地域</Text>
            <Text style={styles.radioDescription}>
              商業施設が多い地域（基準: 昼60dB/夜50dB）
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 録音設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>録音設定</Text>

        <View style={styles.switchItem}>
          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>自動録音</Text>
            <Text style={styles.switchDescription}>
              一定の騒音レベルを超えたら自動で録音
            </Text>
          </View>
          <Switch
            value={settings.autoRecord}
            onValueChange={(value) =>
              setSettings({ ...settings, autoRecord: value })
            }
            trackColor={{ false: '#ccc', true: '#0066cc' }}
            thumbColor="#fff"
          />
        </View>

        {settings.autoRecord && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>録音開始閾値（dB）</Text>
            <TextInput
              style={styles.input}
              value={String(settings.recordThreshold)}
              onChangeText={(value) =>
                setSettings({ ...settings, recordThreshold: parseInt(value) || 60 })
              }
              keyboardType="numeric"
              placeholder="60"
            />
            <Text style={styles.inputHint}>
              この値を超えたら自動的に録音を開始します
            </Text>
          </View>
        )}
      </View>

      {/* 通知設定 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知設定</Text>

        <View style={styles.switchItem}>
          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>プッシュ通知</Text>
            <Text style={styles.switchDescription}>
              騒音検出時に通知を受け取る
            </Text>
          </View>
          <Switch
            value={settings.notificationEnabled}
            onValueChange={(value) =>
              setSettings({ ...settings, notificationEnabled: value })
            }
            trackColor={{ false: '#ccc', true: '#0066cc' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* データ管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ管理</Text>

        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Icon name="delete-forever" size={24} color="#f44336" />
          <Text style={styles.dangerButtonText}>すべてのデータを削除</Text>
        </TouchableOpacity>
      </View>

      {/* アプリ情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>バージョン</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>開発元</Text>
          <Text style={styles.infoValue}>ZENBU株式会社</Text>
        </View>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>利用規約</Text>
          <Icon name="chevron-right" size={20} color="#0066cc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>プライバシーポリシー</Text>
          <Icon name="chevron-right" size={20} color="#0066cc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>お問い合わせ</Text>
          <Icon name="chevron-right" size={20} color="#0066cc" />
        </TouchableOpacity>
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Icon name="save" size={24} color="#fff" />
        <Text style={styles.saveButtonText}>設定を保存</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  radioItemActive: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066cc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0066cc',
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 14,
    color: '#666',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkText: {
    fontSize: 16,
    color: '#0066cc',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SettingsScreen;
