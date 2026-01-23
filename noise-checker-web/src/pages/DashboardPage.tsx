import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Apartment,
  GraphicEq,
  Warning,
  Assignment,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { statisticsService, propertyService } from '../services/api';
import type { Statistics, Property, DashboardCard } from '../types';

// Chart.js 登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 統計データと物件データを並行取得
      const [statsData, propertiesData] = await Promise.all([
        statisticsService.getDashboard(),
        propertyService.getAll(),
      ]);

      setStatistics(statsData);
      setProperties(propertiesData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('ダッシュボードデータの取得に失敗しました。');
      // デモデータを使用
      setStatistics(getDemoStatistics());
      setProperties(getDemoProperties());
    } finally {
      setLoading(false);
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // エラー表示
  if (error && !statistics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // 統計カードデータ
  const dashboardCards: DashboardCard[] = [
    {
      title: '登録物件',
      value: statistics?.totalProperties || 0,
      unit: '件',
      icon: 'apartment',
      color: 'primary',
    },
    {
      title: '今月の測定',
      value: statistics?.totalMeasurements || 0,
      unit: '件',
      icon: 'graphicEq',
      color: 'secondary',
    },
    {
      title: '警告中',
      value: statistics?.alertCount || 0,
      unit: '件',
      icon: 'warning',
      color: 'warning',
    },
    {
      title: '未対応',
      value: statistics?.unresolvedCount || 0,
      unit: '件',
      icon: 'assignment',
      color: 'error',
    },
  ];

  // アイコンのマッピング
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'apartment':
        return <Apartment fontSize="large" />;
      case 'graphicEq':
        return <GraphicEq fontSize="large" />;
      case 'warning':
        return <Warning fontSize="large" />;
      case 'assignment':
        return <Assignment fontSize="large" />;
      default:
        return null;
    }
  };

  // 週次サマリーグラフデータ
  const chartData = {
    labels: statistics?.monthlyTrend?.map((item) => item.date) || [],
    datasets: [
      {
        label: '測定件数',
        data: statistics?.monthlyTrend?.map((item) => item.measurementCount) || [],
        borderColor: 'rgb(0, 102, 204)',
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        tension: 0.3,
      },
      {
        label: '警告件数',
        data: statistics?.monthlyTrend?.map((item) => item.alertCount) || [],
        borderColor: 'rgb(255, 152, 0)',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // 物件のステータス色
  const getPropertyStatusColor = (property: Property): 'success' | 'warning' | 'error' => {
    if (property.alertCount === 0) return 'success';
    if (property.alertCount <= 2) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error} デモデータを表示しています。
        </Alert>
      )}

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                      {card.value}
                      <Typography
                        component="span"
                        variant="h6"
                        color="textSecondary"
                        sx={{ ml: 1 }}
                      >
                        {card.unit}
                      </Typography>
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      color: `${card.color}.main`,
                      opacity: 0.8,
                    }}
                  >
                    {getIcon(card.icon)}
                  </Box>
                </Box>
                {card.trend && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {card.trend.direction === 'up' ? (
                      <TrendingUp fontSize="small" color="success" />
                    ) : (
                      <TrendingDown fontSize="small" color="error" />
                    )}
                    <Typography
                      variant="body2"
                      color={card.trend.direction === 'up' ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {card.trend.value}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* 物件一覧 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                物件一覧
              </Typography>
              <Button variant="outlined" size="small">
                すべて表示
              </Button>
            </Box>

            <List>
              {properties.slice(0, 5).map((property) => (
                <ListItem
                  key={property.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                >
                  <Chip
                    size="small"
                    color={getPropertyStatusColor(property)}
                    sx={{ mr: 2 }}
                  />
                  <ListItemText
                    primary={property.name}
                    secondary={`${property.city} - ${property.totalUnits}戸`}
                  />
                  {property.alertCount > 0 && (
                    <Chip
                      label={`警告 ${property.alertCount}`}
                      size="small"
                      color="warning"
                    />
                  )}
                  {property.unrespondedCount > 0 && (
                    <Chip
                      label={`未対応 ${property.unrespondedCount}`}
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 週次サマリー */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              週次サマリー
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// デモデータ生成関数
const getDemoStatistics = (): Statistics => {
  return {
    totalProperties: 48,
    totalMeasurements: 1234,
    alertCount: 3,
    unresolvedCount: 7,
    averageDb: 58.3,
    monthlyTrend: [
      { date: '1/1', measurementCount: 180, averageDb: 56.2, alertCount: 2 },
      { date: '1/8', measurementCount: 195, averageDb: 57.8, alertCount: 3 },
      { date: '1/15', measurementCount: 210, averageDb: 58.5, alertCount: 4 },
      { date: '1/22', measurementCount: 188, averageDb: 57.1, alertCount: 1 },
    ],
    propertyRanking: [],
    timeDistribution: [],
    noiseLevelDistribution: {
      quiet: 450,
      moderate: 580,
      noisy: 180,
      severe: 24,
    },
  };
};

const getDemoProperties = (): Property[] => {
  return [
    {
      id: '1',
      name: '渋谷グランドマンション',
      address: '渋谷区道玄坂1-2-3',
      city: '渋谷区',
      prefecture: '東京都',
      postalCode: '150-0043',
      totalUnits: 120,
      constructionYear: 2018,
      buildingType: 'mansion',
      status: 'active',
      alertCount: 2,
      unrespondedCount: 1,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      name: '新宿パークハウス',
      address: '新宿区西新宿3-4-5',
      city: '新宿区',
      prefecture: '東京都',
      postalCode: '160-0023',
      totalUnits: 85,
      constructionYear: 2020,
      buildingType: 'apartment',
      status: 'active',
      alertCount: 0,
      unrespondedCount: 0,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
    },
    {
      id: '3',
      name: '世田谷コーポ',
      address: '世田谷区三軒茶屋2-3-4',
      city: '世田谷区',
      prefecture: '東京都',
      postalCode: '154-0024',
      totalUnits: 48,
      constructionYear: 2015,
      buildingType: 'apartment',
      status: 'active',
      alertCount: 5,
      unrespondedCount: 3,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-22',
    },
  ];
};

export default DashboardPage;
