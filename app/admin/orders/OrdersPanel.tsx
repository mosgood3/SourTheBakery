import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, Order } from '../../lib/products';
import { getPickupInfo } from '../../lib/settings';
import { FiRefreshCw, FiDownload, FiChevronDown } from 'react-icons/fi';
import * as XLSX from 'xlsx';

export default function OrdersPanel({ admin }: { admin: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
  const [pickupTime, setPickupTime] = useState<string>('9:00 AM');
  const [pickupDate, setPickupDate] = useState<string>('TBD');
  const [pickupLocation, setPickupLocation] = useState<string>('Sour The Bakery');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
      
      // Fetch pickup time and date from settings
      const pickupInfo = await getPickupInfo();
      const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour12 = parseInt(hours) === 0 ? 12 : parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      };
      setPickupTime(`${formatTime(pickupInfo.timeStart)} - ${formatTime(pickupInfo.timeEnd)}`);
      setPickupLocation(pickupInfo.location);
      
      // Format pickup date from settings (force EST timezone)
      const dateFromSettings = new Date(pickupInfo.date + 'T12:00:00-05:00'); // Force EST noon
      const formattedPickupDate = dateFromSettings.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York'
      });
      setPickupDate(formattedPickupDate);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (admin) fetchOrders(); }, [admin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportDropdown) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportDropdown]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getExportData = () => {
    const openOrders = orders.filter(order => order.status === 'open');
    
    if (openOrders.length === 0) {
      alert('No open orders to export');
      return null;
    }

    return openOrders.map(order => ({
      'Order ID': order.id?.slice(-8) || 'N/A',
      'Customer Name': order.customerName,
      'Customer Email': order.customerEmail,
      'Order Total': `$${order.total.toFixed(2)}`,
      'Order Date': formatDate(order.createdAt),
      'Pickup Date': pickupDate,
      'Pickup Time': pickupTime,
      'Pickup Location': pickupLocation,
      'Items': order.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join('; '),
      'Status': order.status
    }));
  };

  const exportToExcel = () => {
    const exportData = getExportData();
    if (!exportData) return;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Open Orders');
    
    const fileName = `open-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = () => {
    const exportData = getExportData();
    if (!exportData) return;

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `open-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const filteredOrders = orders.filter(order => order.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Order Management</h1>
          <p className="text-brown/70">View and manage customer orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer"
          >
            <FiRefreshCw size={18} />
            Refresh Orders
          </button>
          {activeTab === 'open' && (
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center justify-center gap-2 bg-green-600 border-1 border-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-md cursor-pointer w-full sm:w-auto"
              >
                <FiDownload size={18} />
                Export Orders
                <FiChevronDown size={16} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors rounded-t-xl flex items-center gap-2"
                  >
                    <FiDownload size={16} />
                    <span>Export as CSV</span>
                    <span className="ml-auto text-xs text-gray-500">Mobile friendly</span>
                  </button>
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors rounded-b-xl flex items-center gap-2 border-t border-gray-100"
                  >
                    <FiDownload size={16} />
                    <span>Export as Excel</span>
                    <span className="ml-auto text-xs text-gray-500">Desktop</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-300 focus:outline-none cursor-pointer 
            ${activeTab === 'open' 
              ? 'text-2xl underline underline-offset-8 decoration-4 decoration-accent-gold text-brown' 
              : 'text-lg text-brown/60 hover:text-brown'}
          `}
          onClick={() => setActiveTab('open')}
        >
          Open Orders
        </button>
        <button
          className={`px-6 py-2 rounded-xl font-semibold transition-colors duration-300 focus:outline-none cursor-pointer 
            ${activeTab === 'completed' 
              ? 'text-2xl underline underline-offset-8 decoration-4 decoration-accent-gold text-brown' 
              : 'text-lg text-brown/60 hover:text-brown'}
          `}
          onClick={() => setActiveTab('completed')}
        >
          Completed Orders
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          <p className="mt-4 text-brown/70">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brown/70 text-xl">No {activeTab} orders.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-brown mb-2">Order #{order.id?.slice(-8)}</h3>
                  <p className="text-brown/70">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-accent-gold">Total: ${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-brown/70 mb-1">Customer</p>
                    <p className="text-brown font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brown/70 mb-1">Email</p>
                    <p className="text-brown font-medium">{order.customerEmail}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-brown/70 mb-2">📍 Pickup Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-brown/60">Pickup Date</p>
                      <p className="text-brown font-medium">{pickupDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brown/60">Pickup Time</p>
                      <p className="text-brown font-medium">{pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brown/60">Location</p>
                      <p className="text-brown font-medium">{pickupLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-brown mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-brown/5 rounded-lg">
                      <div>
                        <p className="font-medium text-brown">{item.productName}</p>
                        <p className="text-sm text-brown/70">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-brown">${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              {activeTab === 'open' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusUpdate(order.id!, 'completed')}
                    disabled={updatingStatus === order.id || order.status === 'completed'}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 cursor-pointer ${order.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                  >
                    {updatingStatus === order.id ? 'Updating...' : 'Mark Complete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 