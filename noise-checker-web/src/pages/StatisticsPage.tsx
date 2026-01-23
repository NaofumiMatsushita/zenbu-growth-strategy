import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { statisticsService } from '../services/api';
import type { Statistics } from '../types';

// Chart.js 登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [trendMonths, setTrendMonths] = useState(6);

  useEffect(() => {
    fetchStatistics();
  }, [trendMonths]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getDashboard();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('統計データの取得に失敗しました。デモデータを表示します。');
      setStatistics(getDemoStatistics());
    } finally {
      setLoading(false);
    }
  };

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

  if (!statistics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">統計データの読み込みに失敗しました。</Alert>
      </Box>
    );
  }

  // 月次トレンドグラフ
  const trendChartData = {
    labels: statistics.monthlyTrend.map((item) => item.date),
    datasets: [
      {
        label: '測定件数',
        data: statistics.monthlyTrend.map((item) => item.measurementCount),
        borderColor: 'rgb(0, 102, 204)',
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: '平均dB',
        data: statistics.monthlyTrend.map((item) => item.averageDb),
        borderColor: 'rgb(255, 152, 0)',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '月次トレンド',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '測定件数',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '平均dB',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // 物件別ランキンググラフ
  const propertyChartData = {
    labels: statistics.propertyRanking.map((item) => item.propertyName),
    datasets: [
      {
        label: '測定件数',
        data: statistics.propertyRanking.map((item) => item.measurementCount),
        backgroundColor: 'rgba(0, 102, 204, 0.7)',
      },
      {
        label: '警告件数',
        data: statistics.propertyRanking.map((item) => item.alertCount),
        backgroundColor: 'rgba(255, 152, 0, 0.7)',
      },
    ],
  };

  const propertyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '物件別測定・警告件数',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
  };

  // 時間帯別分布グラフ
  const timeChartData = {
    labels: statistics.timeDistribution.map((item) => `${item.hour}時`),
    datasets: [
      {
        label: '測定件数',
        data: statistics.timeDistribution.map((item) => item.count),
        backgroundColor: 'rgba(0, 168, 232, 0.7)',
        borderColor: 'rgba(0, 168, 232, 1)',
        borderWidth: 1,
      },
    ],
  };

  const timeChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '時間帯別測定件数',
        font: {
          size: 16,
          weight: 'bold',
        },
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

  // 騒音レベル分布
  const noiseLevelChartData = {
    labels: ['静か', '普通', '騒がしい', '非常に騒がしい'],
    datasets: [
      {
        data: [
          statistics.noiseLevelDistribution.quiet,
          statistics.noiseLevelDistribution.moderate,
          statistics.noiseLevelDistribution.noisy,
          statistics.noiseLevelDistribution.severe,
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(33, 150, 243, 0.7)',
          'rgba(255, 152, 0, 0.7)',
          'rgba(244, 67, 54, 0.7)',
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(255, 152, 0, 1)',
          'rgba(244, 67, 54, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const noiseLevelChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: '騒音レベル分布',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          統計・分析
        </Typography>
        <TextField
          select
          size="small"
          label="期間"
          value={trendMonths}
          onChange={(e) => setTrendMonths(Number(e.target.value))}
          sx={{ width: 150 }}
        >
          <MenuItem value={3}>過去3ヶ月</MenuItem>
          <MenuItem value={6}>過去6ヶ月</MenuItem>
          <MenuItem value={12}>過去12ヶ月</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* サマリーカード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                総測定件数
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {statistics.totalMeasurements.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                平均騒音レベル
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {statistics.averageDb.toFixed(1)}
                <Typography component="span" variant="h6" color="textSecondary">
                  {' '}
                  dB
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                警告件数
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {statistics.alertCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                未対応件数
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {statistics.unresolvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* グラフ */}
      <Grid container spacing={3}>
        {/* 月次トレンド */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ height: 400 }}>
              <Line data={trendChartData} options={trendChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* 物件別ランキング */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ height: 400 }}>
              <Bar data={propertyChartData} options={propertyChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* 騒音レベル分布 */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ height: 400 }}>
              <Doughnut data={noiseLevelChartData} options={noiseLevelChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* 時間帯別分布 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ height: 400 }}>
              <Bar data={timeChartData} options={timeChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// デモデータ
const getDemoStatistics = (): Statistics => {
  return {
    totalProperties: 48,
    totalMeasurements: 1234,
    alertCount: 38,
    unresolvedCount: 12,
    averageDb: 58.3,
    monthlyTrend: [
      { date: '2023-08', measurementCount: 180, averageDb: 56.2, alertCount: 5 },
      { date: '2023-09', measurementCount: 195, averageDb: 57.8, alertCount: 7 },
      { date: '2023-10', measurementCount: 210, averageDb: 58.5, alertCount: 8 },
      { date: '2023-11', measurementCount: 188, averageDb: 57.1, alertCount: 4 },
      { date: '2023-12', measurementCount: 225, averageDb: 59.2, alertCount: 9 },
      { date: '2024-01', measurementCount: 236, averageDb: 58.8, alertCount: 5 },
    ],
    propertyRanking: [
      {
        propertyId: '1',
        propertyName: '渋谷グランドマンション',
        measurementCount: 145,
        averageDb: 61.2,
        alertCount: 12,
      },
      {
        propertyId: '2',
        propertyName: '新宿パークハウス',
        measurementCount: 98,
        averageDb: 55.8,
        alertCount: 3,
      },
      {
        propertyId: '3',
        propertyName: '世田谷コーポ',
        measurementCount: 120,
        averageDb: 59.5,
        alertCount: 15,
      },
      {
        propertyId: '4',
        propertyName: '目黒レジデンス',
        measurementCount: 87,
        averageDb: 56.3,
        alertCount: 5,
      },
      {
        propertyId: '5',
        propertyName: '品川タワー',
        measurementCount: 76,
        averageDb: 54.9,
        alertCount: 2,
      },
    ],
    timeDistribution: [
      { hour: 0, count: 12, averageDb: 45.2 },
      { hour: 1, count: 8, averageDb: 42.5 },
      { hour: 2, count: 5, averageDb: 40.8 },
      { hour: 3, count: 3, averageDb: 39.2 },
      { hour: 4, count: 4, averageDb: 41.5 },
      { hour: 5, count: 6, averageDb: 43.8 },
      { hour: 6, count: 15, averageDb: 48.2 },
      { hour: 7, count: 28, averageDb: 52.5 },
      { hour: 8, count: 42, averageDb: 55.8 },
      { hour: 9, count: 38, averageDb: 54.2 },
      { hour: 10, count: 35, averageDb: 53.5 },
      { hour: 11, count: 40, averageDb: 54.8 },
      { hour: 12, count: 45, averageDb: 56.2 },
      { hour: 13, count: 42, averageDb: 55.5 },
      { hour: 14, count: 38, averageDb: 54.8 },
      { hour: 15, count: 40, averageDb: 55.2 },
      { hour: 16, count: 43, averageDb: 56.5 },
      { hour: 17, count: 48, averageDb: 57.8 },
      { hour: 18, count: 55, averageDb: 59.2 },
      { hour: 19, count: 58, averageDb: 60.5 },
      { hour: 20, count: 62, averageDb: 61.8 },
      { hour: 21, count: 68, averageDb: 62.5 },
      { hour: 22, count: 52, averageDb: 58.2 },
      { hour: 23, count: 28, averageDb: 52.8 },
    ],
    noiseLevelDistribution: {
      quiet: 450,
      moderate: 580,
      noisy: 180,
      severe: 24,
    },
  };
};

export default StatisticsPage;
