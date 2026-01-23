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
            <Icon name="place" size={18} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.locationText}>{item.roomNumber}</Text>
          </View>
        )}

        <View style={styles.itemFooter}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Icon name="delete-outline" size={22} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
          <Icon name="chevron-right" size={26} color="rgba(255, 255, 255, 0.4)" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={72} color="rgba(255, 255, 255, 0.3)" />
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
    backgroundColor: '#0a0e27',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterButtonActive: {
    backgroundColor: '#4fc3f7',
    borderColor: '#4fc3f7',
  },
  filterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#4fc3f7',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelIcon: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dbContainer: {
    alignItems: 'flex-end',
  },
  dbValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
  },
  dbUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
  },
  deleteButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  listEmpty: {
    flexGrow: 1,
  },
});

export default HistoryScreen;
