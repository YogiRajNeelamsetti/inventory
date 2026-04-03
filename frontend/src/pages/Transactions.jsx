import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Package,
  Check,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  getPaymentStatusColor,
  handleApiError,
  exportToCSV,
} from '../utils/helpers';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import './Transactions.css';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const SALES_DEFAULT_SORT = { key: 'sale_date', direction: 'desc' };
const PURCHASE_DEFAULT_SORT = { key: 'order_date', direction: 'desc' };

const compareValues = (aValue, bValue, direction) => {
  const directionFactor = direction === 'asc' ? 1 : -1;
  const aEmpty = aValue === null || aValue === undefined || aValue === '';
  const bEmpty = bValue === null || bValue === undefined || bValue === '';

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return (aValue - bValue) * directionFactor;
  }

  return String(aValue).localeCompare(String(bValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * directionFactor;
};

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = ['sales', 'purchases'].includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'sales';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const [salesSort, setSalesSort] = useState(SALES_DEFAULT_SORT);
  const [purchaseSort, setPurchaseSort] = useState(PURCHASE_DEFAULT_SORT);
  const [salesPage, setSalesPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [salesRowsPerPage, setSalesRowsPerPage] = useState(10);
  const [purchaseRowsPerPage, setPurchaseRowsPerPage] = useState(10);
  const [salesPagination, setSalesPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, limit: 10 });
  const [purchasePagination, setPurchasePagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, limit: 10 });

  const searchTimer = useRef(null);
  const dateFilterRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(searchTimer.current);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
    setError('');
    setFeedback(null);
    if (activeTab === 'sales') {
      setSalesPage(1);
      loadSales(searchTerm, dateFilter, 1, salesRowsPerPage);
    } else if (activeTab === 'purchases') {
      setPurchasePage(1);
      loadPurchases(searchTerm, dateFilter, 1, purchaseRowsPerPage);
    }
  }, [activeTab, dateFilter]);

  const loadSales = async (search, dateFilt, page = salesPage, limit = salesRowsPerPage) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilt && dateFilt !== 'all') params.dateFilter = dateFilt;
      params.page = page;
      params.limit = limit;
      const data = await api.getSales(params);
      const salesRows = data?.data?.sales || [];
      const pagination = data?.data?.pagination || {
        current_page: page,
        total_pages: 1,
        total_items: salesRows.length,
        limit,
      };
      setSales(salesRows);
      setSalesPagination(pagination);
    } catch (err) {
      setError(handleApiError(err));
      console.error('Failed to load sales:', err);
    }
    setLoading(false);
  };

  const loadPurchases = async (search, dateFilt, page = purchasePage, limit = purchaseRowsPerPage) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilt && dateFilt !== 'all') params.dateFilter = dateFilt;
      params.page = page;
      params.limit = limit;
      const data = await api.getPurchaseOrders(params);
      const purchaseRows = data?.data?.purchase_orders || [];
      const pagination = data?.data?.pagination || {
        current_page: page,
        total_pages: 1,
        total_items: purchaseRows.length,
        limit,
      };
      setPurchases(purchaseRows);
      setPurchasePagination(pagination);
    } catch (err) {
      setError(handleApiError(err));
      console.error('Failed to load purchases:', err);
    }
    setLoading(false);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setError('');
    if (activeTab === 'sales') {
      setSalesPage(1);
    } else {
      setPurchasePage(1);
    }

    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (activeTab === 'sales') {
        loadSales(value, dateFilter, 1, salesRowsPerPage);
      } else {
        loadPurchases(value, dateFilter, 1, purchaseRowsPerPage);
      }
    }, 350);
  };

  const handleRefresh = () => {
    setError('');
    setFeedback(null);
    if (activeTab === 'sales') {
      loadSales(searchTerm, dateFilter, salesPage, salesRowsPerPage);
    } else {
      loadPurchases(searchTerm, dateFilter, purchasePage, purchaseRowsPerPage);
    }
  };

  const handleExport = () => {
    const rows = activeTab === 'sales'
      ? sales.map((sale) => ({
        bill_number: sale.bill_number,
        customer_name: sale.customer_name || 'Walk-in',
        sale_date: sale.sale_date,
        items_count: sale.items_count,
        total_amount: sale.total_amount,
        discount: sale.discount,
        final_amount: sale.final_amount,
        payment_method: sale.payment_method,
        payment_status: sale.payment_status,
      }))
      : purchases.map((purchase) => ({
        purchase_order_id: `PO-${purchase.id}`,
        supplier_name: purchase.supplier_name,
        order_date: purchase.order_date,
        items_count: purchase.items_count,
        total_amount: purchase.total_amount,
        paid_amount: purchase.paid_amount,
        pending_amount: purchase.pending_amount,
        status: purchase.status,
        payment_status: purchase.payment_status,
      }));

    if (rows.length === 0) {
      setFeedback({ type: 'warning', message: `No ${activeTab} data available to export.` });
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    exportToCSV(rows, `${activeTab}-transactions-${timestamp}`);
  };

  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const recordsLabel = activeTab === 'sales' ? 'sales records' : 'purchase records';
  const recordsCount = activeTab === 'sales' ? salesPagination.total_items : purchasePagination.total_items;

  return (
    <div className="transactions-page page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">Review sales, purchases and payments</p>
        </div>
      </div>

      <div className="command-panel">
        <div className="command-panel-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by bill number, customer or supplier..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search transactions"
          />
        </div>

        <div className="command-panel-filters">
          <div className="date-filter-wrapper" ref={dateFilterRef}>
            <button
              className={`command-panel-btn ${dateFilter !== 'all' ? 'active' : ''}`}
              onClick={() => setShowDateDropdown((prev) => !prev)}
              aria-expanded={showDateDropdown}
              aria-label="Select date range"
              type="button"
            >
              <Calendar size={16} />
              {dateFilterOptions.find((option) => option.value === dateFilter)?.label}
            </button>
            {showDateDropdown && (
              <div className="date-dropdown" role="listbox">
                {dateFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={dateFilter === option.value}
                    className={`date-dropdown-item ${dateFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setDateFilter(option.value);
                      setShowDateDropdown(false);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="command-panel-divider" />

          <button className="command-panel-btn" onClick={handleRefresh} aria-label="Refresh data" type="button">
            <RefreshCw size={16} />
            Refresh
          </button>

          <button className="export-btn" onClick={handleExport} aria-label="Export data" type="button">
            <Download size={16} />
            Export
          </button>
        </div>

        <div className="command-panel-meta">{recordsCount} {recordsLabel}</div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} transactions-feedback`} role="status" aria-live="polite">
          {feedback.message}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'sales' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('sales')}
          type="button"
        >
          <FileText size={18} />
          Sales History
        </button>
        <button
          className={`tab ${activeTab === 'purchases' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('purchases')}
          type="button"
        >
          <Package size={18} />
          Purchase History
        </button>
      </div>

      {error && (
        <ErrorState
          title={activeTab === 'sales' ? 'Sales unavailable' : 'Purchases unavailable'}
          message="Could not load transactions right now."
          details={error}
          onRetry={handleRefresh}
        />
      )}

      <div className="tab-content">
        {activeTab === 'sales' && (
          <SalesHistory
            sales={sales}
            loading={loading}
            sortConfig={salesSort}
            onSortChange={setSalesSort}
            currentPage={salesPage}
            pagination={salesPagination}
            rowsPerPage={salesRowsPerPage}
            onPageChange={(nextPage) => {
              setSalesPage(nextPage);
              loadSales(searchTerm, dateFilter, nextPage, salesRowsPerPage);
            }}
            onRowsPerPageChange={(nextRows) => {
              setSalesRowsPerPage(nextRows);
              setSalesPage(1);
              loadSales(searchTerm, dateFilter, 1, nextRows);
            }}
          />
        )}
        {activeTab === 'purchases' && (
          <PurchaseHistory
            purchases={purchases}
            loading={loading}
            sortConfig={purchaseSort}
            onSortChange={setPurchaseSort}
            currentPage={purchasePage}
            pagination={purchasePagination}
            rowsPerPage={purchaseRowsPerPage}
            onPageChange={(nextPage) => {
              setPurchasePage(nextPage);
              loadPurchases(searchTerm, dateFilter, nextPage, purchaseRowsPerPage);
            }}
            onRowsPerPageChange={(nextRows) => {
              setPurchaseRowsPerPage(nextRows);
              setPurchasePage(1);
              loadPurchases(searchTerm, dateFilter, 1, nextRows);
            }}
            onStatusUpdate={handleRefresh}
            onFeedback={setFeedback}
          />
        )}
      </div>
    </div>
  );
};

const SalesHistory = ({
  sales,
  loading,
  sortConfig,
  onSortChange,
  currentPage,
  pagination,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const getSortValue = (sale, key) => {
    switch (key) {
      case 'bill_number':
        return sale.bill_number || '';
      case 'customer_name':
        return sale.customer_name || 'Walk-in';
      case 'sale_date': {
        const parsed = new Date(sale.sale_date).getTime();
        return Number.isNaN(parsed) ? null : parsed;
      }
      case 'items_count':
      case 'total_amount':
      case 'discount':
      case 'final_amount':
        return Number(sale[key] || 0);
      case 'payment_method':
      case 'payment_status':
        return String(sale[key] || '').toLowerCase();
      default:
        return sale[key] || '';
    }
  };

  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => compareValues(getSortValue(a, sortConfig.key), getSortValue(b, sortConfig.key), sortConfig.direction));
  }, [sales, sortConfig]);

  const totalRows = pagination?.total_items ?? sortedSales.length;
  const totalPages = Math.max(1, pagination?.total_pages || 1);
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const visibleSales = sortedSales;

  useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  const visibleStart = totalRows === 0 ? 0 : pageStartIndex + 1;
  const visibleEnd = totalRows === 0
    ? 0
    : Math.min(pageStartIndex + visibleSales.length, totalRows);

  const toggleSort = (key) => {
    onSortChange((prev) => {
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

  if (loading) {
    return <LoadingState message="Loading sales history..." />;
  }

  if (totalRows === 0) {
    return (
      <EmptyState
        title="No sales found"
        description="No sales records match your current filters."
      />
    );
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-meta">
          Showing {visibleStart}-{visibleEnd} of {totalRows} sales
        </div>
        <div className="table-actions">
          <label className="rows-label" htmlFor="sales-rows-select">Rows</label>
          <select
            id="sales-rows-select"
            className="rows-select"
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
            }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('bill_number')}>
                  Bill Number {renderSortIcon('bill_number')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('customer_name')}>
                  Customer {renderSortIcon('customer_name')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('sale_date')}>
                  Date {renderSortIcon('sale_date')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('items_count')}>
                  Items {renderSortIcon('items_count')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('total_amount')}>
                  Amount {renderSortIcon('total_amount')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('discount')}>
                  Discount {renderSortIcon('discount')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('final_amount')}>
                  Final Amount {renderSortIcon('final_amount')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('payment_method')}>
                  Payment {renderSortIcon('payment_method')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('payment_status')}>
                  Status {renderSortIcon('payment_status')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleSales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <strong>{sale.bill_number}</strong>
                </td>
                <td>{sale.customer_name || 'Walk-in'}</td>
                <td className="text-muted">{formatDateTime(sale.sale_date)}</td>
                <td>{sale.items_count} items</td>
                <td>{formatCurrency(sale.total_amount)}</td>
                <td className="text-muted">
                  {sale.discount > 0 ? formatCurrency(sale.discount) : '-'}
                </td>
                <td>
                  <strong className="text-success">{formatCurrency(sale.final_amount)}</strong>
                </td>
                <td>
                  <span className="badge badge-blue">{sale.payment_method}</span>
                </td>
                <td>
                  <span className={`badge badge-${getPaymentStatusColor(sale.payment_status)}`}>
                    {sale.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="transactions-pagination">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="transactions-page-info">Page {currentPage} of {totalPages}</span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
};

const PurchaseHistory = ({
  purchases,
  loading,
  sortConfig,
  onSortChange,
  currentPage,
  pagination,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onStatusUpdate,
  onFeedback,
}) => {
  const handleStatusChange = async (purchaseId, newStatus) => {
    try {
      await api.updatePurchaseOrderStatus(purchaseId, { status: newStatus });
      if (onStatusUpdate) onStatusUpdate();
      if (onFeedback) {
        onFeedback({ type: 'success', message: `Purchase order PO-${purchaseId} marked as ${newStatus}.` });
      }
    } catch (err) {
      if (onFeedback) {
        onFeedback({ type: 'danger', message: handleApiError(err) });
      }
    }
  };

  const getSortValue = (purchase, key) => {
    switch (key) {
      case 'id':
      case 'items_count':
      case 'total_amount':
      case 'paid_amount':
      case 'pending_amount':
        return Number(purchase[key] || 0);
      case 'order_date': {
        const parsed = new Date(purchase.order_date).getTime();
        return Number.isNaN(parsed) ? null : parsed;
      }
      case 'supplier_name':
      case 'status':
      case 'payment_status':
        return String(purchase[key] || '').toLowerCase();
      default:
        return purchase[key] || '';
    }
  };

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => compareValues(getSortValue(a, sortConfig.key), getSortValue(b, sortConfig.key), sortConfig.direction));
  }, [purchases, sortConfig]);

  const totalRows = pagination?.total_items ?? sortedPurchases.length;
  const totalPages = Math.max(1, pagination?.total_pages || 1);
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const visiblePurchases = sortedPurchases;

  useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  const visibleStart = totalRows === 0 ? 0 : pageStartIndex + 1;
  const visibleEnd = totalRows === 0
    ? 0
    : Math.min(pageStartIndex + visiblePurchases.length, totalRows);

  const toggleSort = (key) => {
    onSortChange((prev) => {
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

  if (loading) {
    return <LoadingState message="Loading purchase history..." />;
  }

  if (totalRows === 0) {
    return (
      <EmptyState
        title="No purchases found"
        description="No purchase records match your current filters."
      />
    );
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-meta">
          Showing {visibleStart}-{visibleEnd} of {totalRows} purchase records
        </div>
        <div className="table-actions">
          <label className="rows-label" htmlFor="purchase-rows-select">Rows</label>
          <select
            id="purchase-rows-select"
            className="rows-select"
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
            }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('id')}>
                  Order ID {renderSortIcon('id')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('supplier_name')}>
                  Supplier {renderSortIcon('supplier_name')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('order_date')}>
                  Date {renderSortIcon('order_date')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('items_count')}>
                  Items {renderSortIcon('items_count')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('total_amount')}>
                  Total Amount {renderSortIcon('total_amount')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('paid_amount')}>
                  Paid Amount {renderSortIcon('paid_amount')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('pending_amount')}>
                  Pending {renderSortIcon('pending_amount')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('status')}>
                  Status {renderSortIcon('status')}
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => toggleSort('payment_status')}>
                  Payment {renderSortIcon('payment_status')}
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePurchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>
                  <strong>PO-{purchase.id}</strong>
                </td>
                <td>{purchase.supplier_name}</td>
                <td className="text-muted">{formatDate(purchase.order_date)}</td>
                <td>{purchase.items_count} items</td>
                <td>
                  <strong>{formatCurrency(purchase.total_amount)}</strong>
                </td>
                <td className="text-success">{formatCurrency(purchase.paid_amount)}</td>
                <td className="text-danger">
                  {purchase.pending_amount > 0 ? formatCurrency(purchase.pending_amount) : '-'}
                </td>
                <td>
                  <span className={`badge badge-${
                    purchase.status === 'received' ? 'green' :
                      purchase.status === 'pending' ? 'orange' : 'red'
                  }`}>
                    {purchase.status}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${
                    purchase.payment_status === 'paid' ? 'green' :
                      purchase.payment_status === 'partial' ? 'orange' : 'red'
                  }`}>
                    {purchase.payment_status}
                  </span>
                </td>
                <td>
                  {purchase.status === 'pending' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleStatusChange(purchase.id, 'received')}
                      aria-label={`Mark order PO-${purchase.id} as received`}
                      type="button"
                    >
                      <Check size={14} />
                      Received
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="transactions-pagination">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="transactions-page-info">Page {currentPage} of {totalPages}</span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
};

export default Transactions;
