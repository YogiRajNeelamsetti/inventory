import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Search,
  Edit2,
  Plus,
  X,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, handleApiError } from '../utils/helpers';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import './Inventory.css';

const DEFAULT_CATEGORIES = [
  { name: 'Grocery' },
  { name: 'Dairy' },
  { name: 'Snacks' },
  { name: 'Beverages' },
  { name: 'Household' },
  { name: 'Personal Care' },
  { name: 'Frozen' },
  { name: 'Bakery' },
  { name: 'Spices' },
  { name: 'Oil & Ghee' },
  { name: 'Pulses' },
  { name: 'Rice & Wheat' },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_SORT = { key: 'name', direction: 'asc' };

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(() => {
    const initial = searchParams.get('filter');
    return ['all', 'low-stock', 'out-of-stock'].includes(initial) ? initial : 'all';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadInventory();
    loadCategories();
  }, []);

  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    const normalizedFilter = ['all', 'low-stock', 'out-of-stock'].includes(urlFilter) ? urlFilter : 'all';

    setFilter((previousFilter) => (previousFilter === normalizedFilter ? previousFilter : normalizedFilter));
  }, [searchParams]);

  useEffect(() => {
    if (filter === 'all') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ filter }, { replace: true });
    }
  }, [filter, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, rowsPerPage]);

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getItemsInventory();
      setItems(data?.data?.items || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setItems([]);
      setError(handleApiError(err));
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      const fetchedCategories = data?.data?.categories || [];
      if (Array.isArray(fetchedCategories) && fetchedCategories.length > 0) {
        const normalized = fetchedCategories
          .map((category) => (typeof category === 'string' ? { name: category } : category))
          .filter((category) => category?.name);
        if (normalized.length > 0) {
          setCategories(normalized);
          return;
        }
      }
      setCategories(DEFAULT_CATEGORIES);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const getSortValue = (item, key) => {
    switch (key) {
      case 'name':
        return item.name?.toLowerCase() || '';
      case 'sku':
        return item.sku?.toLowerCase() || '';
      case 'category':
        return item.category?.toLowerCase() || '';
      case 'current_stock':
      case 'min_stock_threshold':
      case 'purchase_price':
      case 'selling_price':
        return Number(item[key] || 0);
      case 'last_sale_date': {
        if (!item.last_sale_date) return null;
        const parsed = new Date(item.last_sale_date).getTime();
        return Number.isNaN(parsed) ? null : parsed;
      }
      default:
        return item[key] || '';
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemStock = Number(item.current_stock || 0);
      const matchesFilter =
        filter === 'all'
        || (filter === 'low-stock' && item.is_low_stock && itemStock > 0)
        || (filter === 'out-of-stock' && itemStock <= 0);

      const lowerSearch = searchTerm.toLowerCase().trim();
      const matchesSearch =
        item.name?.toLowerCase().includes(lowerSearch)
        || item.sku?.toLowerCase().includes(lowerSearch)
        || item.category?.toLowerCase().includes(lowerSearch);

      return matchesFilter && matchesSearch;
    });
  }, [items, filter, searchTerm]);

  const sortedItems = useMemo(() => {
    const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;

    return [...filteredItems].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);

      const aEmpty = aValue === null || aValue === undefined || aValue === '';
      const bEmpty = bValue === null || bValue === undefined || bValue === '';

      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * directionFactor;
      }

      return String(aValue).localeCompare(String(bValue), undefined, { numeric: true }) * directionFactor;
    });
  }, [filteredItems, sortConfig]);

  const totalRows = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pageStartIndex = (currentPage - 1) * rowsPerPage;

  const paginatedItems = useMemo(
    () => sortedItems.slice(pageStartIndex, pageStartIndex + rowsPerPage),
    [sortedItems, pageStartIndex, rowsPerPage],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visibleStart = totalRows === 0 ? 0 : pageStartIndex + 1;
  const visibleEnd = Math.min(pageStartIndex + rowsPerPage, totalRows);

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        direction: 'asc',
      };
    });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const emptyStateDescription = searchTerm.trim()
    ? 'No items match your current search. Try another keyword or clear filters.'
    : filter === 'low-stock'
      ? 'Great! No low-stock items found right now.'
      : filter === 'out-of-stock'
        ? 'No out-of-stock items at the moment.'
        : 'Add your first inventory item to start tracking stock.';

  const lowStockCount = items.filter((item) => item.is_low_stock && Number(item.current_stock || 0) > 0).length;
  const outOfStockCount = items.filter((item) => Number(item.current_stock || 0) <= 0).length;

  return (
    <div className="inventory-page page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor stock levels and track movements</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      <div className="inventory-stats">
        <div className="stat-box">
          <div className="stat-icon stat-icon-blue">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-label">Total Items</div>
            <div className="stat-number">{items.length}</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon stat-icon-yellow">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-label">Low Stock</div>
            <div className="stat-number text-warning">{lowStockCount}</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon stat-icon-red">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-label">Out of Stock</div>
            <div className="stat-number text-danger">{outOfStockCount}</div>
          </div>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Items
          </button>
          <button
            className={`filter-btn ${filter === 'low-stock' ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter('low-stock')}
          >
            Low Stock
          </button>
          <button
            className={`filter-btn ${filter === 'out-of-stock' ? 'filter-btn-active' : ''}`}
            onClick={() => setFilter('out-of-stock')}
          >
            Out of Stock
          </button>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading inventory..." />
      ) : error ? (
        <ErrorState
          title="Inventory unavailable"
          message="Could not load inventory data right now."
          details={error}
          onRetry={loadInventory}
        />
      ) : totalRows === 0 ? (
        <EmptyState
          title="No inventory records"
          description={emptyStateDescription}
        />
      ) : (
        <>
          <div className="table-toolbar">
            <div className="table-meta">
              Showing {visibleStart}-{visibleEnd} of {totalRows} items
            </div>
            <div className="table-actions">
              <label className="rows-label" htmlFor="inventory-rows-select">Rows</label>
              <select
                id="inventory-rows-select"
                className="rows-select"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('name')}>
                      Item Name {renderSortIcon('name')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('sku')}>
                      SKU {renderSortIcon('sku')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('category')}>
                      Category {renderSortIcon('category')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('current_stock')}>
                      Current Stock {renderSortIcon('current_stock')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('min_stock_threshold')}>
                      Min Threshold {renderSortIcon('min_stock_threshold')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('purchase_price')}>
                      Purchase Price {renderSortIcon('purchase_price')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('selling_price')}>
                      Selling Price {renderSortIcon('selling_price')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="table-sort-btn" onClick={() => toggleSort('last_sale_date')}>
                      Last Sale {renderSortIcon('last_sale_date')}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className={Number(item.current_stock || 0) <= 0 ? 'out-of-stock' : ''}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.is_low_stock && Number(item.current_stock || 0) > 0 && (
                        <span className="badge badge-orange inventory-status-badge">
                          Low
                        </span>
                      )}
                      {Number(item.current_stock || 0) <= 0 && (
                        <span className="badge badge-red inventory-status-badge">
                          Out
                        </span>
                      )}
                    </td>
                    <td className="text-muted">{item.sku}</td>
                    <td>{item.category}</td>
                    <td>
                      <span className={item.is_low_stock ? 'text-warning' : Number(item.current_stock || 0) <= 0 ? 'text-danger' : ''}>
                        {item.current_stock} {item.unit}
                      </span>
                    </td>
                    <td className="text-muted">{item.min_stock_threshold} {item.unit}</td>
                    <td>{formatCurrency(item.purchase_price)}</td>
                    <td className="text-success">{formatCurrency(item.selling_price)}</td>
                    <td className="text-muted">
                      {item.last_sale_date ? formatDate(item.last_sale_date) : 'Never'}
                    </td>
                    <td>
                      <button className="btn-icon btn-sm" onClick={() => handleEditItem(item)}>
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="inventory-pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="inventory-page-info">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {showAddModal && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadInventory();
          }}
        />
      )}

      {showEditModal && editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingItem(null);
            loadInventory();
          }}
        />
      )}
    </div>
  );
};

const AddItemModal = ({ categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    unit: 'piece',
    purchase_price: '',
    selling_price: '',
    current_stock: '',
    min_stock_threshold: '',
    reorder_point: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.addItem({
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        current_stock: parseFloat(formData.current_stock),
        min_stock_threshold: parseFloat(formData.min_stock_threshold),
        reorder_point: parseFloat(formData.reorder_point) || parseFloat(formData.min_stock_threshold),
      });
      onSuccess();
    } catch (err) {
      setError(handleApiError(err));
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add New Item</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Barcode</label>
                <input
                  type="text"
                  className="input"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select
                  className="select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="liter">Liter</option>
                  <option value="packet">Packet</option>
                  <option value="box">Box</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Purchase Price *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="form-group">
                <label className="form-label">Current Stock *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Min Threshold *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.min_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, min_stock_threshold: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Point</label>
                <input
                  type="number"
                  className="input"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditItemModal = ({ item, categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    sku: item.sku || '',
    barcode: item.barcode || '',
    category: item.category || '',
    unit: item.unit || 'piece',
    purchase_price: item.purchase_price || '',
    selling_price: item.selling_price || '',
    current_stock: item.current_stock || '',
    min_stock_threshold: item.min_stock_threshold || '',
    reorder_point: item.reorder_point || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.updateItem(item.id, {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        current_stock: parseFloat(formData.current_stock),
        min_stock_threshold: parseFloat(formData.min_stock_threshold),
        reorder_point: parseFloat(formData.reorder_point) || parseFloat(formData.min_stock_threshold),
      });
      onSuccess();
    } catch (err) {
      setError(handleApiError(err));
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Item</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Barcode</label>
                <input
                  type="text"
                  className="input"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select
                  className="select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="liter">Liter</option>
                  <option value="packet">Packet</option>
                  <option value="box">Box</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Purchase Price *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3">
              <div className="form-group">
                <label className="form-label">Current Stock *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Min Threshold *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.min_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, min_stock_threshold: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Point</label>
                <input
                  type="number"
                  className="input"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
