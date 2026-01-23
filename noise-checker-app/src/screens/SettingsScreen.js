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
            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#4fc3f7' }}
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
            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#4fc3f7' }}
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
          <Icon name="chevron-right" size={22} color="#4fc3f7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>プライバシーポリシー</Text>
          <Icon name="chevron-right" size={22} color="#4fc3f7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>お問い合わせ</Text>
          <Icon name="chevron-right" size={22} color="#4fc3f7" />
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
    backgroundColor: '#0a0e27',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 18,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 6,
    lineHeight: 18,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  radioItemActive: {
    borderColor: '#4fc3f7',
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#4fc3f7',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4fc3f7',
  },
  radioContent: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  radioDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  switchContent: {
    flex: 1,
    marginRight: 14,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  switchDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderWidth: 2,
    borderColor: '#ef5350',
    borderRadius: 12,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef5350',
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkText: {
    fontSize: 16,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4fc3f7',
    margin: 16,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 10,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SettingsScreen;
