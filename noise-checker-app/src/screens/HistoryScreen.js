import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAllMeasurements, deleteMeasurement } from '../utils/Storage';
import { determineNoiseLevel } from '../utils/NoiseAnalyzer';

const HistoryScreen = ({ navigation }) => {
  const [measurements, setMeasurements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'noisy', 'quiet'

  useEffect(() => {
    loadMeasurements();

    // 画面がフォーカスされたときにリロード
    const unsubscribe = navigation.addListener('focus', () => {
      loadMeasurements();
    });

    return unsubscribe;
  }, [navigation]);

  const loadMeasurements = async () => {
    const data = await getAllMeasurements();
    setMeasurements(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeasurements();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      '削除確認',
      'この測定データを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await deleteMeasurement(id);
            await loadMeasurements();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const filteredMeasurements = measurements.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'noisy') return m.maxDb >= 60;
    if (filter === 'quiet') return m.maxDb < 60;
    return true;
  });

  const renderItem = ({ item }) => {
    const noiseLevel = determineNoiseLevel(item.maxDb);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() =>
          navigation.navigate('MeasurementResult', { measurement: item })
        }
      >
        <View style={styles.itemHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.levelIcon}>{noiseLevel.icon}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.dateText}>{formatDateTime(item.startTime)}</Text>
            <Text style={[styles.levelText, { color: noiseLevel.color }]}>
              {noiseLevel.label}
            </Text>
          </View>
          <View style={styles.dbContainer}>
            <Text style={styles.dbValue}>{item.maxDb.toFixed(1)}</Text>
            <Text style={styles.dbUnit}>dB</Text>
          </View>
        </View>

        {item.roomNumber && (
          <View style={styles.locationContainer}>
            <Icon name="place" size={16} color="#999" />
            <Text style={styles.locationText}>{item.roomNumber}</Text>
          </View>
        )}

        <View style={styles.itemFooter}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Icon name="delete-outline" size={20} color="#999" />
          </TouchableOpacity>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={64} color="#ccc" />
      <Text style={styles.emptyText}>測定履歴がありません</Text>
      <Text style={styles.emptySubtext}>
        ホーム画面から測定を開始してください
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* フィルタ */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            すべて
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'noisy' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('noisy')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'noisy' && styles.filterTextActive,
            ]}
          >
            騒音あり
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'quiet' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('quiet')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'quiet' && styles.filterTextActive,
            ]}
          >
            静か
          </Text>
        </TouchableOpacity>
      </View>

      {/* 統計サマリー */}
      {measurements.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{measurements.length}</Text>
            <Text style={styles.statLabel}>総測定回数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {measurements.filter((m) => m.maxDb >= 60).length}
            </Text>
            <Text style={styles.statLabel}>騒音検出</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(
                measurements.reduce((sum, m) => sum + m.maxDb, 0) /
                measurements.length
              ).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>平均dB</Text>
          </View>
        </View>
      )}

      {/* リスト */}
      <FlatList
        data={filteredMeasurements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          filteredMeasurements.length === 0 ? styles.listEmpty : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0066cc',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dbContainer: {
    alignItems: 'flex-end',
  },
  dbValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  dbUnit: {
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  listEmpty: {
    flexGrow: 1,
  },
});

export default HistoryScreen;
