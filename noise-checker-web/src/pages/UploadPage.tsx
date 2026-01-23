import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  GraphicEq as GraphicEqIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { measurementService, propertyService } from '../services/api';
import type { Property, Measurement, UploadFile } from '../types';

interface UploadResult {
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  measurement?: Measurement;
  error?: string;
}

const UploadPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [notes, setNotes] = useState('');
  const [measuredAt, setMeasuredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const data = await propertyService.getAll();
      setProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      // デモデータ
      const demo = getDemoProperties();
      setProperties(demo);
      setSelectedPropertyId(demo[0].id);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!selectedPropertyId || !roomNumber) {
        alert('物件と部屋番号を選択してください');
        return;
      }

      setIsUploading(true);

      // アップロード結果を初期化
      const initialResults: UploadResult[] = acceptedFiles.map((file) => ({
        file,
        status: 'uploading',
        progress: 0,
      }));
      setUploadResults(initialResults);

      // 各ファイルをアップロード
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        try {
          // プログレス更新
          setUploadResults((prev) =>
            prev.map((result, index) =>
              index === i ? { ...result, progress: 50 } : result
            )
          );

          // アップロード実行
          const uploadData: UploadFile = {
            file,
            propertyId: selectedPropertyId,
            roomId: roomNumber,
            reporterName,
            reporterContact,
            notes,
            measuredAt,
          };

          const measurement = await measurementService.upload(uploadData);

          // 成功
          setUploadResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? { ...result, status: 'success', progress: 100, measurement }
                : result
            )
          );
        } catch (err) {
          console.error('Upload failed:', err);
          // エラー
          setUploadResults((prev) =>
            prev.map((result, index) =>
              index === i
                ? {
                    ...result,
                    status: 'error',
                    progress: 100,
                    error: 'アップロードに失敗しました',
                  }
                : result
            )
          );
        }
      }

      setIsUploading(false);
    },
    [selectedPropertyId, roomNumber, reporterName, reporterContact, notes, measuredAt]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.m4a', '.aac'],
    },
    disabled: isUploading,
  });

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

  const getNoiseLevelText = (level: string): string => {
    switch (level) {
      case 'quiet':
        return '静か';
      case 'moderate':
        return '普通';
      case 'noisy':
        return '騒がしい';
      case 'severe':
        return '非常に騒がしい';
      default:
        return level;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        音声ファイルアップロード
      </Typography>

      <Grid container spacing={3}>
        {/* フォーム */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              測定情報
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                select
                label="物件"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                fullWidth
                required
              >
                {properties.map((property) => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="部屋番号"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="101"
                fullWidth
                required
              />

              <TextField
                label="測定日時"
                type="datetime-local"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                label="報告者名"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="任意"
                fullWidth
              />

              <TextField
                label="連絡先"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="任意"
                fullWidth
              />

              <TextField
                label="備考"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="任意"
                fullWidth
              />
            </Box>
          </Paper>
        </Grid>

        {/* アップロードエリア */}
        <Grid item xs={12} md={8}>
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: isUploading ? 'divider' : 'primary.main',
                backgroundColor: isUploading ? 'background.paper' : 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'ここにドロップしてください'
                : 'ファイルをドラッグ&ドロップ'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              または
            </Typography>
            <Button variant="contained" disabled={isUploading} sx={{ mt: 2 }}>
              ファイルを選択
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              対応形式: WAV, MP3, M4A, AAC
            </Typography>
          </Paper>

          {/* アップロード結果 */}
          {uploadResults.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                アップロード結果
              </Typography>

              {uploadResults.map((result, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {result.status === 'success' && (
                          <CheckIcon color="success" />
                        )}
                        {result.status === 'error' && <ErrorIcon color="error" />}
                        {result.status === 'uploading' && <GraphicEqIcon />}
                        <Typography variant="body1" fontWeight={600}>
                          {result.file.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {(result.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>

                    {result.status === 'uploading' && (
                      <LinearProgress
                        variant="determinate"
                        value={result.progress}
                        sx={{ mb: 1 }}
                      />
                    )}

                    {result.status === 'error' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {result.error}
                      </Alert>
                    )}

                    {result.status === 'success' && result.measurement && (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              平均dB
                            </Typography>
                            <Typography variant="h6">
                              {result.measurement.averageDb.toFixed(1)} dB
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              最大dB
                            </Typography>
                            <Typography variant="h6">
                              {result.measurement.maxDb.toFixed(1)} dB
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              騒音レベル
                            </Typography>
                            <Chip
                              label={getNoiseLevelText(result.measurement.noiseLevel)}
                              color={getNoiseLevelColor(result.measurement.noiseLevel)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">
                              環境基準
                            </Typography>
                            <Chip
                              label={
                                result.measurement.exceedsStandard
                                  ? '基準超過'
                                  : '基準内'
                              }
                              color={
                                result.measurement.exceedsStandard ? 'error' : 'success'
                              }
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>
                        </Grid>
                        {result.measurement.soundSource && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                              音源推定
                            </Typography>
                            <Typography variant="body1">
                              {result.measurement.soundSource}
                              {result.measurement.soundSourceConfidence && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="textSecondary"
                                  sx={{ ml: 1 }}
                                >
                                  (信頼度:{' '}
                                  {(result.measurement.soundSourceConfidence * 100).toFixed(
                                    0
                                  )}
                                  %)
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

// デモデータ
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
  ];
};

export default UploadPage;
