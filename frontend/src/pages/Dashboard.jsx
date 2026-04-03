import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  IndianRupee,
  FileText,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import './Dashboard.css';

const Dashboard = () => {
  const { dashboardData, refreshDashboard } = useApp();
  const [loading, setLoading] = useState(!dashboardData);
  const navigate = useNavigate();

  useEffect(() => {
    loadData(!dashboardData);
  }, []);

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    await refreshDashboard();
    if (showLoader) setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="alert alert-danger">Failed to load dashboard data</div>;
  }

  const { today, this_month, inventory, payments } = dashboardData;

  const stats = [
    {
      label: "Today's Sales",
      value: formatCurrency(today.sales),
      icon: IndianRupee,
      color: 'red',
      subtext: `${today.bills} bills`,
    },
    {
      label: "Today's Profit",
      value: formatCurrency(today.profit),
      icon: TrendingUp,
      color: 'blue',
      subtext: `Cash: ${formatCurrency(today.cash_sales)}`,
    },
    {
      label: 'This Month',
      value: formatCurrency(this_month.sales),
      icon: ShoppingBag,
      color: 'yellow',
      subtext: `${this_month.bills} bills`,
    },
    {
      label: 'Monthly Profit',
      value: formatCurrency(this_month.profit),
      icon: TrendingUp,
      color: 'green',
      subtext: `Purchases: ${formatCurrency(this_month.purchases)}`,
    },
  ];

  const alerts = [
    {
      label: 'Low Stock Items',
      value: inventory.low_stock_items,
      icon: AlertTriangle,
      color: 'warning',
      action: () => navigate('/inventory?filter=low-stock'),
    },
    {
      label: 'Out of Stock',
      value: inventory.out_of_stock_items,
      icon: Package,
      color: 'danger',
      action: () => navigate('/inventory?filter=out-of-stock'),
    },
    {
      label: 'Supplier Dues',
      value: formatCurrency(payments.pending_supplier_payments),
      icon: Clock,
      color: 'warning',
      action: () => navigate('/transactions?tab=purchases'),
    },
    {
      label: 'Customer Credit',
      value: formatCurrency(payments.pending_customer_payments),
      icon: FileText,
      color: 'info',
      action: () => navigate('/transactions?tab=sales'),
    },
  ];

  return (
    <div className="dashboard page-shell">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your shop performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  <Icon size={24} />
                </div>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-subtext">{stat.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Inventory Summary */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <Package size={20} />
            Inventory Overview
          </h2>
        </div>
        <div className="inventory-summary">
          <div className="summary-item">
            <span className="summary-label">Total Items</span>
            <span className="summary-value">{inventory.total_items}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Stock Value</span>
            <span className="summary-value">
              {formatCurrency(inventory.total_stock_value)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Low Stock</span>
            <span className="summary-value text-warning">
              {inventory.low_stock_items}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Out of Stock</span>
            <span className="summary-value text-danger">
              {inventory.out_of_stock_items}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="alerts-grid">
        {alerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <button
              key={index}
              className={`alert-card alert-${alert.color}`}
              onClick={alert.action}
            >
              <div className="alert-icon">
                <Icon size={20} />
              </div>
              <div className="alert-content">
                <div className="alert-label">{alert.label}</div>
                <div className="alert-value">{alert.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Payment Summary */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <IndianRupee size={20} />
            Payment Methods (Today)
          </h2>
        </div>
        <div className="payment-summary">
          <div className="payment-item">
            <span className="payment-label">Cash</span>
            <span className="payment-value">
              {formatCurrency(today.cash_sales)}
            </span>
          </div>
          <div className="payment-item">
            <span className="payment-label">Digital</span>
            <span className="payment-value">
              {formatCurrency(today.digital_sales)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
