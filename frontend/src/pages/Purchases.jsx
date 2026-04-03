import React, { useState, useEffect } from 'react';
import {
  Plus,
  ShoppingCart,
  Package,
  Truck,
  X,
  Check,
  CreditCard,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, handleApiError } from '../utils/helpers';
import './Purchases.css';

const Purchases = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    setFeedback(null);
    if (activeTab === 'suppliers') {
      loadSuppliers();
    } else {
      loadPurchaseOrders();
    }
  }, [activeTab]);

  const loadSuppliers = async () => {
    if (activeTab === 'suppliers') setLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data.data.suppliers || []);
    } catch (error) {
      setFeedback({ type: 'danger', message: handleApiError(error) });
      console.error('Failed to load suppliers:', error);
    }
    if (activeTab === 'suppliers') setLoading(false);
  };

  const loadPurchaseOrders = async () => {
    if (activeTab === 'orders') setLoading(true);
    try {
      const data = await api.getPurchaseOrders();
      setPurchaseOrders(data.data.purchase_orders || []);
    } catch (error) {
      setFeedback({ type: 'danger', message: handleApiError(error) });
      console.error('Failed to load purchase orders:', error);
    }
    if (activeTab === 'orders') setLoading(false);
  };

  return (
    <div className="purchases-page page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Management</h1>
          <p className="page-subtitle">Manage suppliers and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => setShowSupplierModal(true)}
          >
            <Plus size={18} />
            Add Supplier
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowPurchaseModal(true)}
          >
            <ShoppingCart size={18} />
            New Purchase
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} purchases-feedback`} role="status" aria-live="polite">
          {feedback.message}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'orders' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={18} />
          Purchase Orders
        </button>
        <button
          className={`tab ${activeTab === 'suppliers' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Truck size={18} />
          Suppliers
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'orders' && (
          <PurchaseOrdersList
            orders={purchaseOrders}
            loading={loading}
            onRefresh={loadPurchaseOrders}
            onFeedback={setFeedback}
            onRowClick={(id) => setSelectedOrderId(id)}
          />
        )}
        {activeTab === 'suppliers' && (
          <SuppliersList
            suppliers={suppliers}
            loading={loading}
            onRowClick={(id) => setSelectedSupplierId(id)}
          />
        )}
      </div>

      {showSupplierModal && (
        <AddSupplierModal
          onClose={() => setShowSupplierModal(false)}
          onSuccess={() => {
            setShowSupplierModal(false);
            loadSuppliers();
            setFeedback({ type: 'success', message: 'Supplier added successfully.' });
          }}
        />
      )}
      {showPurchaseModal && (
        <AddPurchaseModal
          suppliers={suppliers}
          onFeedback={setFeedback}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            setShowPurchaseModal(false);
            loadPurchaseOrders();
            setFeedback({ type: 'success', message: 'Purchase order created successfully.' });
          }}
        />
      )}
      {selectedOrderId && (
        <PurchaseDetailModal
          orderId={selectedOrderId}
          onFeedback={setFeedback}
          onClose={() => setSelectedOrderId(null)}
          onUpdate={() => {
            loadPurchaseOrders();
          }}
        />
      )}
      {selectedSupplierId && (
        <SupplierDetailModal
          supplierId={selectedSupplierId}
          onClose={() => setSelectedSupplierId(null)}
        />
      )}
    </div>
  );
};

// ======================== Suppliers List ========================
const SuppliersList = ({ suppliers, loading, onRowClick }) => {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Truck size={48} />
        </div>
        <h3 className="empty-state-title">No Suppliers Yet</h3>
        <p className="empty-state-description">
          Add your first supplier to start managing purchases
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>GST Number</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr
              key={supplier.id}
              className="table-row-clickable"
              onClick={() => onRowClick(supplier.id)}
            >
              <td>
                <strong>{supplier.company_name}</strong>
              </td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.phone}</td>
              <td>
                <code className="text-muted">{supplier.gst_number}</code>
              </td>
              <td className="text-muted">{supplier.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ======================== Purchase Orders List ========================
const PurchaseOrdersList = ({ orders, loading, onRefresh, onRowClick, onFeedback }) => {
  const updateStatus = async (e, orderId, status) => {
    e.stopPropagation();
    try {
      await api.updatePurchaseOrderStatus(orderId, { status });
      if (onFeedback) {
        onFeedback({ type: 'success', message: `Purchase order PO-${orderId} marked as ${status}.` });
      }
      onRefresh();
    } catch (error) {
      if (onFeedback) {
        onFeedback({ type: 'danger', message: handleApiError(error) });
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Package size={48} />
        </div>
        <h3 className="empty-state-title">No Purchase Orders</h3>
        <p className="empty-state-description">
          Create your first purchase order to track inventory
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Supplier</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="table-row-clickable"
              onClick={() => onRowClick(order.id)}
            >
              <td>
                <strong>PO-{order.id}</strong>
              </td>
              <td>{order.supplier_name}</td>
              <td>{formatDate(order.order_date)}</td>
              <td>{order.items_count} items</td>
              <td>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </td>
              <td>
                <span
                  className={`badge badge-${
                    order.status === 'received'
                      ? 'green'
                      : order.status === 'pending'
                      ? 'orange'
                      : 'red'
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td>
                <span
                  className={`badge badge-${
                    order.payment_status === 'paid'
                      ? 'green'
                      : order.payment_status === 'partial'
                      ? 'orange'
                      : 'red'
                  }`}
                >
                  {order.payment_status}
                </span>
                {order.payment_status !== 'paid' && (
                  <div className="text-muted pending-amount-meta">
                    Pending: {formatCurrency(order.pending_amount)}
                  </div>
                )}
              </td>
              <td>
                {order.status === 'pending' && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => updateStatus(e, order.id, 'received')}
                  >
                    <Check size={16} />
                    Mark Received
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ======================== Purchase Detail Modal ========================
const PurchaseDetailModal = ({ orderId, onClose, onUpdate, onFeedback }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    reference_number: '',
    notes: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setActionError('');
    try {
      const data = await api.getPurchaseOrderById(orderId);
      setOrder(data.data.purchase_order);
    } catch (error) {
      setActionError(handleApiError(error));
      console.error('Failed to load order:', error);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (status) => {
    setActionError('');
    setStatusLoading(true);
    try {
      await api.updatePurchaseOrderStatus(orderId, { status });
      await loadOrder();
      onUpdate();
      if (onFeedback) {
        onFeedback({ type: 'success', message: `Purchase order PO-${orderId} marked as ${status}.` });
      }
    } catch (error) {
      setActionError(handleApiError(error));
    }
    setStatusLoading(false);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setActionError('Please enter a valid amount');
      return;
    }
    setPaymentLoading(true);
    try {
      await api.recordSupplierPayment({
        supplier_id: order.supplier_id,
        purchase_order_id: orderId,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
      });
      setPaymentData({ amount: '', method: 'cash', reference_number: '', notes: '' });
      setShowPaymentForm(false);
      await loadOrder();
      onUpdate();
      if (onFeedback) {
        onFeedback({ type: 'success', message: 'Supplier payment recorded successfully.' });
      }
    } catch (error) {
      setActionError(handleApiError(error));
    }
    setPaymentLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{order ? `PO-${order.id}` : 'Purchase Order'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {actionError && <div className="alert alert-danger">{actionError}</div>}

          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : !order ? (
            <div className="empty-state"><p>Order not found</p></div>
          ) : (
            <>
              {/* Header Info */}
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Supplier</span>
                  <span className="detail-value">{order.supplier_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDate(order.order_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`badge badge-${order.status === 'received' ? 'green' : order.status === 'pending' ? 'orange' : 'red'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payment</span>
                  <span className={`badge badge-${order.payment_status === 'paid' ? 'green' : order.payment_status === 'partial' ? 'orange' : 'red'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="detail-summary">
                <div className="summary-row">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Paid Amount</span>
                  <span className="text-success">{formatCurrency(order.paid_amount)}</span>
                </div>
                {order.pending_amount > 0 && (
                  <div className="summary-row">
                    <span>Pending Amount</span>
                    <span className="text-danger">{formatCurrency(order.pending_amount)}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="detail-section">
                <h4>Order Items ({order.items?.length || 0})</h4>
                <div className="table-container table-container-borderless">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.item_name}</strong></td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td><strong>{formatCurrency(item.amount)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {order.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p className="text-muted">{order.notes}</p>
                </div>
              )}

              {/* Payment Form */}
              {showPaymentForm && order.payment_status !== 'paid' && (
                <div className="detail-section payment-form-section">
                  <h4>Record Payment</h4>
                  <form onSubmit={handleRecordPayment}>
                    <div className="grid grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Amount *</label>
                        <input
                          type="number"
                          className="input"
                          value={paymentData.amount}
                          onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                          max={order.pending_amount}
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Method</label>
                        <select
                          className="select"
                          value={paymentData.method}
                          onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                        >
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="upi">UPI</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reference Number</label>
                      <input
                        type="text"
                        className="input"
                        value={paymentData.reference_number}
                        onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                        placeholder="Transaction/Cheque number"
                      />
                    </div>
                    <div className="detail-actions-row">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPaymentForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={paymentLoading}>
                        {paymentLoading ? 'Recording...' : 'Record Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {order && (
          <div className="modal-footer">
            {order.status === 'pending' && (
              <button
                className="btn btn-primary"
                onClick={() => handleStatusUpdate('received')}
                disabled={statusLoading}
              >
                <Check size={16} />
                {statusLoading ? 'Updating...' : 'Mark Received'}
              </button>
            )}
            {order.payment_status !== 'paid' && !showPaymentForm && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowPaymentForm(true)}
              >
                <CreditCard size={16} />
                Record Payment
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ======================== Supplier Detail Modal ========================
const SupplierDetailModal = ({ supplierId, onClose }) => {
  const [supplier, setSupplier] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplierData();
  }, [supplierId]);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [supplierRes, ordersRes, paymentsRes] = await Promise.all([
        api.getSupplierById(supplierId),
        api.getSupplierPurchaseOrders(supplierId),
        api.getSupplierPayments(supplierId),
      ]);
      setSupplier(supplierRes.data.supplier);
      setPurchaseOrders(ordersRes.data.purchase_orders || []);
      setPayments(paymentsRes.data.payments || []);
    } catch (error) {
      console.error('Failed to load supplier details:', error);
    }
    setLoading(false);
  };

  const totalOrdered = purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);
  const totalPaid = purchaseOrders.reduce((sum, po) => sum + parseFloat(po.paid_amount || 0), 0);
  const totalPending = totalOrdered - totalPaid;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{supplier?.company_name || 'Supplier Details'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : !supplier ? (
            <div className="empty-state"><p>Supplier not found</p></div>
          ) : (
            <>
              {/* Supplier Info */}
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  <span className="detail-value">{supplier.contact_person || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{supplier.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{supplier.email || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">GST Number</span>
                  <span className="detail-value">{supplier.gst_number || '-'}</span>
                </div>
              </div>

              {supplier.address && (
                <div className="detail-section">
                  <h4>Address</h4>
                  <p className="text-muted">{supplier.address}</p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="detail-summary">
                <div className="summary-row">
                  <span>Total Ordered</span>
                  <strong>{formatCurrency(totalOrdered)}</strong>
                </div>
                <div className="summary-row">
                  <span>Total Paid</span>
                  <span className="text-success">{formatCurrency(totalPaid)}</span>
                </div>
                {totalPending > 0 && (
                  <div className="summary-row">
                    <span>Pending</span>
                    <span className="text-danger">{formatCurrency(totalPending)}</span>
                  </div>
                )}
              </div>

              {/* Purchase History */}
              <div className="detail-section">
                <h4>Purchase History ({purchaseOrders.length})</h4>
                {purchaseOrders.length === 0 ? (
                  <p className="text-muted">No purchases from this supplier yet.</p>
                ) : (
                  <div className="table-container table-container-borderless">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.map((po) => (
                          <tr key={po.id}>
                            <td><strong>PO-{po.id}</strong></td>
                            <td className="text-muted">{formatDate(po.order_date)}</td>
                            <td>{formatCurrency(po.total_amount)}</td>
                            <td>
                              <span className={`badge badge-${po.status === 'received' ? 'green' : po.status === 'pending' ? 'orange' : 'red'}`}>
                                {po.status}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${po.payment_status === 'paid' ? 'green' : po.payment_status === 'partial' ? 'orange' : 'red'}`}>
                                {po.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="detail-section">
                  <h4>Payment History ({payments.length})</h4>
                  <div className="table-container table-container-borderless">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td className="text-muted">{p.date ? formatDate(p.date) : '-'}</td>
                            <td><strong className="text-success">{formatCurrency(p.amount)}</strong></td>
                            <td><span className="badge badge-blue">{p.method || 'N/A'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ======================== Add Supplier Modal ========================
const AddSupplierModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.addSupplier(formData);
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
          <h2>Add New Supplier</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="input"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="input"
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_person: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="input"
                  value={formData.gst_number}
                  onChange={(e) =>
                    setFormData({ ...formData, gst_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                className="textarea"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================== Add Purchase Modal ========================
const AddPurchaseModal = ({ suppliers, onClose, onSuccess, onFeedback }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    items: [],
    notes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', sku: '', category: '', unit: 'piece',
    purchase_price: '', selling_price: '', current_stock: 0,
    min_stock_threshold: 0,
  });
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const loadAllItems = async () => {
      try {
        const data = await api.getItems();
        setAllItems(data.data.items || []);
      } catch (error) {
        console.error('Failed to load items:', error);
      }
      setItemsLoading(false);
    };
    loadAllItems();
  }, []);

  const handleSearch = (term) => {
    setFormError('');
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredItems([]);
      setShowDropdown(false);
      return;
    }
    const lower = term.toLowerCase();
    const alreadyAdded = new Set(formData.items.map((i) => i.item_id));
    const matches = allItems.filter(
      (item) =>
        !alreadyAdded.has(item.id) &&
        (item.name.toLowerCase().includes(lower) ||
          (item.sku && item.sku.toLowerCase().includes(lower)) ||
          (item.barcode && item.barcode.toLowerCase().includes(lower)) ||
          (item.category && item.category.toLowerCase().includes(lower)))
    );
    setFilteredItems(matches);
    setShowDropdown(true);
  };

  const openCreateItemForm = () => {
    setShowNewItemForm(true);
    setShowDropdown(false);
    setNewItem((prev) => ({ ...prev, name: searchTerm.trim() || prev.name }));
  };

  const addItem = (item) => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_id: item.id,
          item_name: item.name,
          quantity: 1,
          unit_price: item.purchase_price,
        },
      ],
    });
    setSearchTerm('');
    setFilteredItems([]);
    setShowDropdown(false);
  };

  const handleCreateNewItem = async () => {
    if (!newItem.name || !newItem.purchase_price || !newItem.selling_price) {
      setFormError('Name, purchase price, and selling price are required');
      return;
    }
    setFormError('');
    try {
      const resp = await api.addItem({
        ...newItem,
        purchase_price: parseFloat(newItem.purchase_price),
        selling_price: parseFloat(newItem.selling_price),
        current_stock: parseFloat(newItem.current_stock) || 0,
        min_stock_threshold: parseFloat(newItem.min_stock_threshold) || 0,
      });
      const created = resp.data.item;
      setAllItems((prev) => [...prev, created]);
      addItem(created);
      setShowNewItemForm(false);
      setNewItem({
        name: '', sku: '', category: '', unit: 'piece',
        purchase_price: '', selling_price: '', current_stock: 0,
        min_stock_threshold: 0,
      });
      if (onFeedback) {
        onFeedback({ type: 'success', message: 'New item created and added to purchase order.' });
      }
    } catch (error) {
      setFormError(handleApiError(error));
    }
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      setFormError('Please add at least one item');
      return;
    }

    setFormError('');
    setLoading(true);
    try {
      await api.createPurchaseOrder({
        supplier_id: parseInt(formData.supplier_id),
        total_amount: calculateTotal(),
        notes: formData.notes,
        items: formData.items.map((i) => ({
          item_id: i.item_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
      onSuccess();
    } catch (error) {
      setFormError(handleApiError(error));
    }
    setLoading(false);
  };

  const noResults = showDropdown && searchTerm.trim() && filteredItems.length === 0;

  return (
    <div className="modal-overlay">
      <div className="modal modal-xwide">
        <div className="modal-header">
          <h2>Create Purchase Order</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && <div className="alert alert-danger">{formError}</div>}

            <div className="form-group">
              <label className="form-label">Select Supplier *</label>
              <select
                className="select"
                value={formData.supplier_id}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_id: e.target.value })
                }
                required
              >
                <option value="">Choose a supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group purchase-search-group">
              <label className="form-label">Search & Add Items</label>
              <div className="purchase-search-field">
                <input
                  type="text"
                  className="input"
                  placeholder={itemsLoading ? 'Loading items...' : 'Search by name, SKU, barcode, or category...'}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchTerm.trim()) handleSearch(searchTerm); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={itemsLoading}
                />
                {showDropdown && filteredItems.length > 0 && (
                  <div className="search-results">
                    {filteredItems.slice(0, 10).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="search-result-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addItem(item)}
                      >
                        <div>
                          <strong>{item.name}</strong>
                          <div className="text-muted">
                            {item.sku && `SKU: ${item.sku}`}
                            {item.sku && item.category && ' · '}
                            {item.category && item.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div>{formatCurrency(item.purchase_price)}</div>
                          <div className="text-muted">Stock: {item.current_stock}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {noResults && !showNewItemForm && (
                  <div className="search-results">
                    <div className="search-no-results">
                      <p>No items found for "<strong>{searchTerm}</strong>"</p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={openCreateItemForm}
                      >
                        <Plus size={16} />
                        Create New Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showNewItemForm && (
              <div className="new-item-form">
                <div className="new-item-form-header">
                  <h4>Create New Item</h4>
                  <button type="button" className="btn-icon" onClick={() => setShowNewItemForm(false)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Item Name *</label>
                    <input type="text" className="input" value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input type="text" className="input" value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input type="text" className="input" value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      placeholder="e.g. Groceries" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Price *</label>
                    <input type="number" className="input" value={newItem.purchase_price}
                      onChange={(e) => setNewItem({ ...newItem, purchase_price: e.target.value })}
                      min="0.01" step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price *</label>
                    <input type="number" className="input" value={newItem.selling_price}
                      onChange={(e) => setNewItem({ ...newItem, selling_price: e.target.value })}
                      min="0.01" step="0.01" required />
                  </div>
                </div>
                <div className="new-item-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewItemForm(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateNewItem}>
                    <Check size={16} />
                    Create & Add to Order
                  </button>
                </div>
              </div>
            )}

            {formData.items.length > 0 && (
              <div className="purchase-items">
                <h4>Order Items ({formData.items.length})</h4>
                <div className="purchase-item purchase-item-header">
                  <div>Item</div>
                  <div>Qty</div>
                  <div>Unit Price</div>
                  <div>Total</div>
                  <div></div>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="purchase-item">
                    <div className="purchase-item-name">{item.item_name}</div>
                    <input
                      type="number"
                      className="input purchase-item-qty-input"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="number"
                      className="input purchase-item-price-input"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                      }
                      min="0.01"
                      step="0.01"
                    />
                    <div className="purchase-item-total">
                      {formatCurrency((item.quantity || 0) * (item.unit_price || 0))}
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeItem(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="purchase-total">
                  <strong>Total: {formatCurrency(calculateTotal())}</strong>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="textarea"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Delivery instructions, payment terms, etc."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : `Create Purchase Order (${formatCurrency(calculateTotal())})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchases;
