import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';
import { propertyService } from '../services/api';
import type { Property } from '../types';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // フォームデータ
  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    address: '',
    city: '',
    prefecture: '東京都',
    postalCode: '',
    totalUnits: 0,
    constructionYear: new Date().getFullYear(),
    buildingType: 'apartment',
    status: 'active',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchText, properties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertyService.getAll();
      setProperties(data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError('物件データの取得に失敗しました。デモデータを表示します。');
      setProperties(getDemoProperties());
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchText) {
      setFilteredProperties(properties);
      return;
    }

    const filtered = properties.filter(
      (property) =>
        property.name.toLowerCase().includes(searchText.toLowerCase()) ||
        property.address.toLowerCase().includes(searchText.toLowerCase()) ||
        property.city.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredProperties(filtered);
  };

  const handleOpenDialog = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setFormData(property);
    } else {
      setEditingProperty(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        prefecture: '東京都',
        postalCode: '',
        totalUnits: 0,
        constructionYear: new Date().getFullYear(),
        buildingType: 'apartment',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProperty(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    try {
      if (editingProperty) {
        // 更新
        const updated = await propertyService.update(editingProperty.id, formData);
        setProperties(properties.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        // 新規作成
        const newProperty = await propertyService.create(formData);
        setProperties([newProperty, ...properties]);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save property:', err);
      alert('物件の保存に失敗しました。');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この物件を削除してもよろしいですか？')) {
      return;
    }

    try {
      await propertyService.delete(id);
      setProperties(properties.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete property:', err);
      alert('物件の削除に失敗しました。');
    }
  };

  const getStatusColor = (property: Property): 'success' | 'warning' | 'error' => {
    if (property.alertCount === 0) return 'success';
    if (property.alertCount <= 2) return 'warning';
    return 'error';
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

  return (
    <Box>
      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="物件を検索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          物件を追加
        </Button>
      </Box>

      {/* 物件カード一覧 */}
      <Grid container spacing={3}>
        {filteredProperties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ApartmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Chip
                      size="small"
                      color={getStatusColor(property)}
                      label={property.alertCount === 0 ? '正常' : `警告${property.alertCount}`}
                    />
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(property)}
                      sx={{ mr: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(property.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {property.name}
                </Typography>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {property.address}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={`${property.totalUnits}戸`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`${property.constructionYear}年築`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={
                      property.buildingType === 'mansion'
                        ? 'マンション'
                        : property.buildingType === 'apartment'
                        ? 'アパート'
                        : '一戸建て'
                    }
                    variant="outlined"
                  />
                </Box>

                {property.unrespondedCount > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      size="small"
                      color="error"
                      label={`未対応: ${property.unrespondedCount}件`}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProperties.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary">
            物件が見つかりませんでした
          </Typography>
        </Box>
      )}

      {/* 物件登録・編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProperty ? '物件を編集' : '物件を追加'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="物件名"
              fullWidth
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />
            <TextField
              label="住所"
              fullWidth
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="都道府県"
                value={formData.prefecture}
                onChange={(e) => handleFormChange('prefecture', e.target.value)}
                sx={{ width: '40%' }}
              />
              <TextField
                label="市区町村"
                value={formData.city}
                onChange={(e) => handleFormChange('city', e.target.value)}
                sx={{ width: '60%' }}
              />
            </Box>
            <TextField
              label="郵便番号"
              value={formData.postalCode}
              onChange={(e) => handleFormChange('postalCode', e.target.value)}
              placeholder="100-0001"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="総戸数"
                type="number"
                value={formData.totalUnits}
                onChange={(e) => handleFormChange('totalUnits', parseInt(e.target.value))}
                sx={{ width: '50%' }}
              />
              <TextField
                label="築年"
                type="number"
                value={formData.constructionYear}
                onChange={(e) =>
                  handleFormChange('constructionYear', parseInt(e.target.value))
                }
                sx={{ width: '50%' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            {editingProperty ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
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
    {
      id: '4',
      name: '目黒レジデンス',
      address: '目黒区中目黒1-1-1',
      city: '目黒区',
      prefecture: '東京都',
      postalCode: '153-0061',
      totalUnits: 60,
      constructionYear: 2019,
      buildingType: 'mansion',
      status: 'active',
      alertCount: 1,
      unrespondedCount: 0,
      createdAt: '2024-01-08',
      updatedAt: '2024-01-19',
    },
    {
      id: '5',
      name: '品川タワー',
      address: '品川区東品川2-2-2',
      city: '品川区',
      prefecture: '東京都',
      postalCode: '140-0002',
      totalUnits: 200,
      constructionYear: 2021,
      buildingType: 'mansion',
      status: 'active',
      alertCount: 0,
      unrespondedCount: 0,
      createdAt: '2024-01-12',
      updatedAt: '2024-01-21',
    },
    {
      id: '6',
      name: '中野アパート',
      address: '中野区中野5-5-5',
      city: '中野区',
      prefecture: '東京都',
      postalCode: '164-0001',
      totalUnits: 32,
      constructionYear: 2012,
      buildingType: 'apartment',
      status: 'active',
      alertCount: 3,
      unrespondedCount: 2,
      createdAt: '2024-01-06',
      updatedAt: '2024-01-20',
    },
  ];
};

export default PropertiesPage;
