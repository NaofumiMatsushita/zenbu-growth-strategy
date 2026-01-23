import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Checkbox,
  Toolbar,
  Typography,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { measurementService, propertyService } from '../services/api';
import type { Measurement, Property, MeasurementFilter } from '../types';

const DataPage: React.FC = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // フィルター
  const [filter, setFilter] = useState<MeasurementFilter>({
    searchText: '',
    propertyId: '',
    noiseLevel: [],
    status: [],
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [page, rowsPerPage, filter]);

  const fetchProperties = async () => {
    try {
      const data = await propertyService.getAll();
      setProperties(data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await measurementService.getAll(filter, page + 1, rowsPerPage);
      setMeasurements(response.data);
      setTotalCount(response.pagination.total);
    } catch (err) {
      console.error('Failed to fetch measurements:', err);
      setError('データの取得に失敗しました。デモデータを表示します。');
      setMeasurements(getDemoMeasurements());
      setTotalCount(getDemoMeasurements().length);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(measurements.map((m) => m.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selected.length}件のデータを削除してもよろしいですか？`)) {
      return;
    }

    try {
      await measurementService.bulkDelete(selected);
      setSelected([]);
      fetchMeasurements();
    } catch (err) {
      console.error('Failed to delete measurements:', err);
      alert('削除に失敗しました。');
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await measurementService.exportCsv(filter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `measurements_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('エクスポートに失敗しました。');
    }
  };

  const handleFilterChange = (field: keyof MeasurementFilter, value: any) => {
    setFilter({ ...filter, [field]: value });
    setPage(0);
  };

  const getNoiseLevelColor = (
    level: string
  ): 'success' | 'info' | 'warning' | 'error' => {
    switch (level) {
      case 'quiet':
        return 'success';
      case 'moderate':
        return 'info';
      case 'noisy':
        return 'warning';
      case 'severe':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'reviewing':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'dismissed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return '未対応';
      case 'reviewing':
        return '確認中';
      case 'resolved':
        return '解決済み';
      case 'dismissed':
        return '却下';
      default:
        return status;
    }
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        データ管理
      </Typography>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* フィルター */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="検索..."
              value={filter.searchText}
              onChange={(e) => handleFilterChange('searchText', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="物件"
              value={filter.propertyId || ''}
              onChange={(e) => handleFilterChange('propertyId', e.target.value)}
            >
              <MenuItem value="">すべて</MenuItem>
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="開始日"
              value={filter.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              type="date"
              fullWidth
              size="small"
              label="終了日"
              value={filter.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              fullWidth
            >
              CSVエクスポート
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* テーブルツールバー */}
      {selected.length > 0 && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            bgcolor: 'action.selected',
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
            {selected.length} 件選択中
          </Typography>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
          >
            削除
          </Button>
        </Toolbar>
      )}

      {/* テーブル */}
      <TableContainer component={Paper}>
        {loading ? (
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
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selected.length > 0 && selected.length < measurements.length
                      }
                      checked={
                        measurements.length > 0 &&
                        selected.length === measurements.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>測定日時</TableCell>
                  <TableCell>物件</TableCell>
                  <TableCell>部屋</TableCell>
                  <TableCell>平均dB</TableCell>
                  <TableCell>最大dB</TableCell>
                  <TableCell>騒音レベル</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurements.map((measurement) => {
                  const isItemSelected = isSelected(measurement.id);
                  const property = properties.find(
                    (p) => p.id === measurement.propertyId
                  );

                  return (
                    <TableRow
                      hover
                      key={measurement.id}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={() => handleSelectOne(measurement.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(measurement.measuredAt).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>{property?.name || '-'}</TableCell>
                      <TableCell>{measurement.roomId}</TableCell>
                      <TableCell>{measurement.averageDb.toFixed(1)} dB</TableCell>
                      <TableCell>{measurement.maxDb.toFixed(1)} dB</TableCell>
                      <TableCell>
                        <Chip
                          label={measurement.noiseLevel}
                          size="small"
                          color={getNoiseLevelColor(measurement.noiseLevel)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(measurement.status)}
                          size="small"
                          color={getStatusColor(measurement.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="表示件数:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} / ${count}件`
              }
            />
          </>
        )}
      </TableContainer>
    </Box>
  );
};

// デモデータ
const getDemoMeasurements = (): Measurement[] => {
  return [
    {
      id: '1',
      propertyId: '1',
      roomId: '201',
      audioFileUrl: 'https://example.com/audio1.wav',
      audioFileName: 'measurement_20240120_201.wav',
      audioFileSize: 2048576,
      audioDuration: 60,
      averageDb: 62.5,
      maxDb: 75.3,
      minDb: 48.2,
      noiseLevel: 'noisy',
      isNoiseDetected: true,
      standardDay: 55,
      standardNight: 45,
      timeOfDay: 'night',
      exceedsStandard: true,
      soundSource: '足音',
      soundSourceConfidence: 0.85,
      notes: '深夜の足音がうるさい',
      reporterName: '佐藤太郎',
      reporterContact: '090-1234-5678',
      status: 'pending',
      measuredAt: '2024-01-20T23:30:00',
      createdAt: '2024-01-20T23:35:00',
      updatedAt: '2024-01-20T23:35:00',
    },
    {
      id: '2',
      propertyId: '1',
      roomId: '305',
      audioFileUrl: 'https://example.com/audio2.wav',
      audioFileName: 'measurement_20240119_305.wav',
      audioFileSize: 1536789,
      audioDuration: 45,
      averageDb: 48.2,
      maxDb: 55.8,
      minDb: 42.1,
      noiseLevel: 'moderate',
      isNoiseDetected: false,
      standardDay: 55,
      standardNight: 45,
      timeOfDay: 'day',
      exceedsStandard: false,
      soundSource: '会話',
      soundSourceConfidence: 0.72,
      status: 'resolved',
      measuredAt: '2024-01-19T14:20:00',
      createdAt: '2024-01-19T14:25:00',
      updatedAt: '2024-01-20T10:00:00',
    },
    {
      id: '3',
      propertyId: '2',
      roomId: '101',
      audioFileUrl: 'https://example.com/audio3.wav',
      audioFileName: 'measurement_20240118_101.wav',
      audioFileSize: 3145728,
      audioDuration: 90,
      averageDb: 72.8,
      maxDb: 85.2,
      minDb: 58.5,
      noiseLevel: 'severe',
      isNoiseDetected: true,
      standardDay: 55,
      standardNight: 45,
      timeOfDay: 'night',
      exceedsStandard: true,
      soundSource: 'テレビ・音楽',
      soundSourceConfidence: 0.91,
      notes: '夜間のテレビ音量が非常に大きい',
      reporterName: '鈴木花子',
      reporterContact: '080-9876-5432',
      status: 'reviewing',
      assignedTo: '管理担当A',
      measuredAt: '2024-01-18T22:15:00',
      createdAt: '2024-01-18T22:20:00',
      updatedAt: '2024-01-19T09:00:00',
    },
  ];
};

export default DataPage;
