import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Trash2, User, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatCurrency, handleApiError } from '../utils/helpers';
import './Billing.css';

const WALK_IN_CUSTOMER = {
  id: null,
  name: 'Walk-in Customer',
  phone_number: 'No contact details',
  email: '',
  isWalkIn: true
};

const Billing = () => {
  const { refreshDashboard } = useApp();
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const searchRequestId = useRef(0);

  const searchItems = useCallback(async (term) => {
    if (!term) {
      setSearchResults([]);
      return;
    }
    const requestId = ++searchRequestId.current;
    try {
      const data = await api.getAvailableItems({ search: term });
      if (requestId === searchRequestId.current) {
        setSearchResults(data.data.items || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, []);

  const debounceTimer = useRef(null);
  const debouncedSearch = useCallback((term) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchItems(term), 300);
  }, [searchItems]);

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.item_id === item.id);
    if (existingItem) {
      updateQuantity(existingItem.item_id, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        item_id: item.id,
        item_name: item.name,
        quantity: 1,
        unit_price: item.selling_price,
        max_stock: item.current_stock
      }]);
    }
    setQuantityDrafts((prev) => {
      if (!(item.id in prev)) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateQuantity = (itemId, newQuantity) => {
    const item = cart.find(i => i.item_id === itemId);
    if (newQuantity > item.max_stock) {
      setNotice({ type: 'warning', message: `Only ${item.max_stock} units available in stock` });
      return;
    }
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(i => 
      i.item_id === itemId ? { ...i, quantity: newQuantity } : i
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(i => i.item_id !== itemId));
    setQuantityDrafts((prev) => {
      if (!(itemId in prev)) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleQuantityInputChange = (itemId, rawValue) => {
    setQuantityDrafts((prev) => ({ ...prev, [itemId]: rawValue }));
    if (rawValue === '') {
      return;
    }

    const parsed = parseFloat(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    updateQuantity(itemId, parsed);
  };

  const handleQuantityInputBlur = (itemId) => {
    const rawValue = quantityDrafts[itemId];
    if (rawValue === undefined) {
      return;
    }

    const trimmed = rawValue.trim();
    if (trimmed === '') {
      setQuantityDrafts((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }

    const parsed = parseFloat(trimmed);
    if (Number.isNaN(parsed)) {
      setQuantityDrafts((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }

    updateQuantity(itemId, parsed);
    setQuantityDrafts((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setNotice({ type: 'warning', message: 'Please add items to cart before checkout.' });
      return;
    }

    setNotice(null);
    setLoading(true);
    try {
      const saleData = {
        customer_id: customer?.id || null,
        sale_date: new Date().toISOString(),
        items: cart.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          //total: parseFloat(item.quantity * item.unit_price)
        })),
        discount,
        total_amount: parseFloat(calculateSubtotal()),
        final_amount: parseFloat(calculateTotal()), 
        payment_method: paymentMethod,
        payment_status: 'paid',
        paid_amount: calculateTotal()
      };

        await api.createSale(saleData);
        await refreshDashboard();
        setNotice({ type: 'success', message: 'Bill created successfully.' });
      
      // Reset form
      setCart([]);
      setQuantityDrafts({});
      setDiscount(0);
      setCustomer(null);
      setPaymentMethod('cash');
    } catch (error) {
      setNotice({ type: 'danger', message: handleApiError(error) });
    }
    setLoading(false);
  };

  return (
    <div className="billing-page page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing / Point of Sale</h1>
          <p className="page-subtitle">Create customer bills and process sales</p>
        </div>
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} billing-notice`} role="status" aria-live="polite">
          {notice.message}
        </div>
      )}

      <div className="billing-grid">
        {/* Left Panel - Cart */}
        <div className="cart-panel">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <ShoppingBag size={20} />
                Shopping Cart ({cart.length} items)
              </h3>
            </div>

            {/* Customer Info */}
            <CustomerSearch customer={customer} setCustomer={setCustomer} onNotice={setNotice} />

            {/* Item Search */}
            <div className="form-group billing-search-group">
              <label className="form-label">Search Items</label>
              <input
                type="text"
                className="input"
                placeholder="Search by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      className="search-result-item"
                      onClick={() => addToCart(item)}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <div className="text-muted">SKU: {item.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-success">{formatCurrency(item.selling_price)}</div>
                        <div className="text-muted">Stock: {item.current_stock}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-state billing-empty-state">
                  <div className="empty-state-icon">
                    <ShoppingBag size={48} />
                  </div>
                  <p className="empty-state-description">
                    Search and add items to create a bill
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.item_id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.item_name}</div>
                      <div className="cart-item-price">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <input
                        type="number"
                        className="input billing-qty-input"
                        value={quantityDrafts[item.item_id] ?? String(item.quantity)}
                        onChange={(e) => handleQuantityInputChange(item.item_id, e.target.value)}
                        onBlur={() => handleQuantityInputBlur(item.item_id)}
                        min="0.01"
                        step="0.01"
                      />
                      <div className="cart-item-total">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </div>
                      <button
                        className="btn-icon"
                        onClick={() => removeFromCart(item.item_id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Summary */}
        <div className="summary-panel">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Bill Summary</h3>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span className="summary-value">{formatCurrency(calculateSubtotal())}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Discount (₹)</label>
              <input
                type="number"
                className="input"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span className="summary-value">{formatCurrency(calculateTotal())}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <button
              className="btn btn-primary w-full btn-lg"
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
            >
              {loading ? 'Processing...' : `Generate Bill • ${formatCurrency(calculateTotal())}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerSearch = ({ customer, setCustomer, onNotice }) => {
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const custRequestId = useRef(0);

  const searchCustomers = useCallback(async (name) => {
    if (!name || name.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const requestId = ++custRequestId.current;
    setSearching(true);
    try {
      const data = await api.getCustomers({ search: name });
      if (requestId === custRequestId.current) {
        setSearchResults(data.data.customers || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Customer search failed:', error);
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  const custDebounceTimer = useRef(null);
  const debouncedCustomerSearch = useCallback((name) => {
    clearTimeout(custDebounceTimer.current);
    custDebounceTimer.current = setTimeout(() => searchCustomers(name), 300);
  }, [searchCustomers]);

  const selectCustomer = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setSearchName('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleAddNewCustomer = () => {
    setShowAddModal(true);
    setShowDropdown(false);
  };

  const handleSelectWalkInCustomer = () => {
    setCustomer({ ...WALK_IN_CUSTOMER });
    setSearchName('');
    setSearchResults([]);
    setShowDropdown(false);
    if (onNotice) {
      onNotice({ type: 'success', message: 'Walk-in customer selected for this bill.' });
    }
  };

  return (
    <>
      <div className="customer-section">
        {customer ? (
          <div className={`customer-info ${customer.isWalkIn ? 'customer-info-walkin' : ''}`}>
            <User size={20} />
            <div>
              <div className="customer-name">{customer.name}</div>
              <div className="customer-phone">
                {customer.isWalkIn ? 'No customer details captured' : customer.phone_number}
              </div>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setCustomer(null)}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="customer-search">
            <input
              type="text"
              className="input"
              placeholder="Search customer by name..."
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                debouncedCustomerSearch(e.target.value);
              }}
              onFocus={() => searchName.length >= 2 && setShowDropdown(true)}
            />
            <div className="customer-search-actions">
              <button
                className="btn btn-primary"
                onClick={handleAddNewCustomer}
                title="Add New Customer"
              >
                <Plus size={16} />
              </button>
              <button
                className="btn btn-secondary walk-in-btn"
                onClick={handleSelectWalkInCustomer}
                title="Use Walk-in Customer"
              >
                <User size={16} />
                <span>Walk-in</span>
              </button>
            </div>
            
            {showDropdown && (
              <div className="search-results customer-search-results">
                {searching ? (
                  <div className="search-result-item search-result-item-disabled">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <button
                      className="search-result-item walk-in-customer-btn"
                      onClick={handleSelectWalkInCustomer}
                    >
                      <User size={16} />
                      <span>Use Walk-in Customer</span>
                    </button>
                    {searchResults.map((cust) => (
                      <button
                        key={cust.id}
                        className="search-result-item"
                        onClick={() => selectCustomer(cust)}
                      >
                        <div>
                          <strong>{cust.name}</strong>
                          <div className="text-muted">{cust.phone_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted">{cust.email || 'No email'}</div>
                        </div>
                      </button>
                    ))}
                    <button
                      className="search-result-item add-customer-btn"
                      onClick={handleAddNewCustomer}
                    >
                      <Plus size={16} />
                      <span>Add New Customer</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="search-result-item search-result-item-disabled">
                      No customers found for "{searchName}"
                    </div>
                    <button
                      className="search-result-item walk-in-customer-btn"
                      onClick={handleSelectWalkInCustomer}
                    >
                      <User size={16} />
                      <span>Use Walk-in Customer</span>
                    </button>
                    <button
                      className="search-result-item add-customer-btn"
                      onClick={handleAddNewCustomer}
                    >
                      <Plus size={16} />
                      <span>Add New Customer "{searchName}"</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCustomerModal
          initialName={searchName}
          onClose={() => setShowAddModal(false)}
          onNotice={onNotice}
          onSuccess={(newCustomer) => {
            setCustomer(newCustomer);
            setShowAddModal(false);
            setSearchName('');
            if (onNotice) {
              onNotice({ type: 'success', message: 'Customer added and selected for this bill.' });
            }
          }}
        />
      )}
    </>
  );
};

const AddCustomerModal = ({ initialName = '', onClose, onSuccess, onNotice }) => {
  const [formData, setFormData] = useState({
    name: initialName,
    phone_number: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.addCustomer(formData);
      onSuccess(response.data.customer);
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      if (onNotice) {
        onNotice({ type: 'danger', message });
      }
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add New Customer</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                type="tel"
                className="input"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
                maxLength="10"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                className="textarea"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Billing;
