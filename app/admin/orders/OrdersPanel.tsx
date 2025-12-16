import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, Order } from '../../lib/products-supabase';
import { getPickupInfo } from '../../lib/settings-supabase';
import { getAllPickups, Pickup } from '../../lib/pickups-supabase';
import { FiRefreshCw, FiDownload, FiChevronDown, FiX, FiPrinter, FiCalendar } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isProcessing?: boolean;
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  isProcessing = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif font-bold text-brown">{title}</h3>
          <button
            onClick={onClose}
            className="text-brown/50 hover:text-brown transition-colors"
            disabled={isProcessing}
          >
            <FiX size={24} />
          </button>
        </div>
        <p className="text-brown/70 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors duration-300 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPanel({ admin }: { admin: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [selectedPickupFilter, setSelectedPickupFilter] = useState<string>('all');
  const [pickupTime, setPickupTime] = useState<string>('9:00 AM');
  const [pickupLocation, setPickupLocation] = useState<string>('Sour The Bakery');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk', orderId?: string } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [fetchedOrders, fetchedPickups] = await Promise.all([
        getOrders(),
        getAllPickups()
      ]);
      setOrders(fetchedOrders);
      setPickups(fetchedPickups);

      // Fetch pickup time and date from settings (for legacy orders)
      const pickupInfo = await getPickupInfo();
      const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour12 = parseInt(hours) === 0 ? 12 : parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      };
      setPickupTime(`${formatTime(pickupInfo.timeStart)} - ${formatTime(pickupInfo.timeEnd)}`);
      setPickupLocation(pickupInfo.location);
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
      setSelectedOrders(new Set()); // Clear selections after update
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const requestSingleComplete = (orderId: string) => {
    setConfirmAction({ type: 'single', orderId });
    setShowConfirmModal(true);
  };

  const requestBulkComplete = () => {
    setConfirmAction({ type: 'bulk' });
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'single' && confirmAction.orderId) {
        await handleStatusUpdate(confirmAction.orderId, 'completed');
      } else if (confirmAction.type === 'bulk') {
        setUpdatingStatus('bulk');
        for (const orderId of Array.from(selectedOrders)) {
          await updateOrderStatus(orderId, 'completed');
        }
        fetchOrders();
        setSelectedOrders(new Set());
      }
    } catch (err) {
      setError('Failed to complete orders');
    } finally {
      setUpdatingStatus(null);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.filter(o => o.status === 'open').length) {
      setSelectedOrders(new Set());
    } else {
      const allOpenOrders = new Set(filteredOrders.filter(o => o.status === 'open').map(o => o.id!));
      setSelectedOrders(allOpenOrders);
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

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatPickupDate = (pickupDate: string | undefined) => {
    if (!pickupDate) return 'TBD';
    const date = new Date(pickupDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York'
    });
  };

  const getExportData = (filterType: 'open' | 'completed') => {
    const filteredOrders = orders.filter(order => order.status === filterType);

    if (filteredOrders.length === 0) {
      alert(`No ${filterType} orders to export`);
      return null;
    }

    return filteredOrders.map(order => {
      const pickup = order.pickup_id ? pickups.find(p => p.id === order.pickup_id) : null;
      return {
        'Order ID': order.id?.slice(-8) || 'N/A',
        'Pickup Event': getPickupName(order),
        'Customer Name': order.customer_name,
        'Customer Email': order.customer_email,
        'Order Total': `$${order.total.toFixed(2)}`,
        'Order Date': formatDate(order.created_at),
        'Pickup Date': pickup ? formatPickupDate(pickup.pickup_date) : formatPickupDate(order.pickup_date),
        'Pickup Time': pickup ? `${pickup.pickup_time_start} - ${pickup.pickup_time_end}` : pickupTime,
        'Pickup Location': pickup ? pickup.pickup_location : pickupLocation,
        'Items': order.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join('; '),
        'Status': order.status
      };
    });
  };

  const exportToExcel = (filterType: 'open' | 'completed') => {
    const exportData = getExportData(filterType);
    if (!exportData) return;

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Orders`);

    const fileName = `${filterType}-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = (filterType: 'open' | 'completed') => {
    const exportData = getExportData(filterType);
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
    link.setAttribute('download', `${filterType}-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printOpenOrders = () => {
    const openOrders = orders.filter(order => order.status === 'open');

    if (openOrders.length === 0) {
      alert('No open orders to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print orders');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Open Orders - ${new Date().toLocaleDateString()}</title>
          <style>
            @page {
              margin: 1in 0.5in 0.5in 0.5in;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 13pt;
              line-height: 1.5;
              color: #000;
            }
            .receipt {
              page-break-after: always;
              max-width: 5in;
              margin: 0 auto 30px;
              border: 1px dashed #000;
              padding: 0;
            }
            .receipt:last-child {
              page-break-after: auto;
            }
            .receipt-content {
              padding: 25px 15px 15px 15px;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 20pt;
              font-weight: bold;
            }
            .header .tagline {
              font-size: 12pt;
              margin: 2px 0;
            }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 10px 0;
            }
            .divider-solid {
              border-bottom: 1px solid #000;
              margin: 10px 0;
            }
            .order-info {
              text-align: center;
              margin-bottom: 10px;
            }
            .order-number {
              font-size: 18pt;
              font-weight: bold;
              margin: 5px 0;
            }
            .info-line {
              margin: 3px 0;
              font-size: 11pt;
            }
            .section-title {
              font-weight: bold;
              text-transform: uppercase;
              margin: 10px 0 5px 0;
              font-size: 13pt;
            }
            .customer-line {
              margin: 3px 0;
              font-size: 12pt;
            }
            .pickup-box {
              padding: 5px 0;
              margin: 8px 0;
              text-align: left;
              font-size: 10pt;
              color: #666;
            }
            .pickup-box .label {
              font-weight: normal;
              font-size: 9pt;
              display: inline;
            }
            .pickup-box .value {
              font-size: 10pt;
              margin: 0;
              display: inline;
            }
            .items-header {
              display: flex;
              font-weight: bold;
              border-bottom: 2px solid #000;
              padding: 8px 0;
              margin-top: 15px;
              font-size: 14pt;
            }
            .items-header .qty {
              width: 50px;
            }
            .items-header .item {
              flex: 1;
            }
            .items-header .price {
              width: 90px;
              text-align: right;
            }
            .item-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px dotted #999;
              font-size: 14pt;
            }
            .item-row .qty {
              width: 50px;
              font-weight: bold;
              font-size: 16pt;
            }
            .item-row .item {
              flex: 1;
              font-weight: bold;
            }
            .item-row .price {
              width: 90px;
              text-align: right;
              font-weight: bold;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              font-size: 18pt;
              font-weight: bold;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 11pt;
            }
            .thank-you {
              font-weight: bold;
              margin: 5px 0;
            }
            @media print {
              body {
                margin: 0;
              }
              .receipt {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          ${openOrders.map(order => `
            <div class="receipt">
              <div class="receipt-content">
                <div class="header">
                  <h1>SOUR THE BAKERY</h1>
                  <div class="tagline">Lets get sour</div>
                </div>

                <div class="order-info">
                  <div class="order-number">ORDER #${order.id?.slice(-8)}</div>
                  <div class="info-line">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                </div>

                <div class="divider"></div>

                <div class="section-title">CUSTOMER</div>
                <div class="customer-line">${order.customer_name}</div>
                <div class="customer-line">${order.customer_email}</div>

                <div class="divider"></div>

                <div class="pickup-box">
                  <div><span class="label">Event:</span> <span class="value">${(() => {
                    const pickup = order.pickup_id ? pickups.find(p => p.id === order.pickup_id) : null;
                    return pickup ? formatPickupDate(pickup.pickup_date) : 'Legacy Order';
                  })()}</span></div>
                  <div><span class="label">Pickup:</span> <span class="value">${(() => {
                    const pickup = order.pickup_id ? pickups.find(p => p.id === order.pickup_id) : null;
                    if (pickup) {
                      return `${formatPickupDate(pickup.pickup_date)} ${pickup.pickup_time_start} - ${pickup.pickup_time_end}`;
                    }
                    return `${formatPickupDate(order.pickup_date)} ${pickupTime}`;
                  })()}</span></div>
                  <div><span class="label">Location:</span> <span class="value">${(() => {
                    const pickup = order.pickup_id ? pickups.find(p => p.id === order.pickup_id) : null;
                    return pickup ? pickup.pickup_location : pickupLocation;
                  })()}</span></div>
                </div>

                <div class="divider-solid"></div>

                <div class="items-header">
                  <div class="qty">QTY</div>
                  <div class="item">ITEM</div>
                  <div class="price">PRICE</div>
                </div>

                ${order.items.map(item => `
                  <div class="item-row">
                    <div class="qty">${item.quantity}</div>
                    <div class="item">${item.productName}</div>
                    <div class="price">$${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}

                <div class="total-line">
                  <span>TOTAL:</span>
                  <span>$${order.total.toFixed(2)}</span>
                </div>

                <div class="footer">
                  <div class="thank-you">THANK YOU!</div>
                  <div>Please arrive during pickup window</div>
                  <div>Questions? info@sourthebakery.com</div>
                </div>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };


  // Filter by status and pickup
  let filteredOrders = showOnlyOpen ? orders.filter(order => order.status === 'open') : orders;

  // Apply pickup filter
  if (selectedPickupFilter !== 'all') {
    if (selectedPickupFilter === 'no-pickup') {
      filteredOrders = filteredOrders.filter(order => !order.pickup_id);
    } else {
      filteredOrders = filteredOrders.filter(order => order.pickup_id === selectedPickupFilter);
    }
  }

  const openOrders = filteredOrders.filter(o => o.status === 'open');
  const allOpenSelected = openOrders.length > 0 && selectedOrders.size === openOrders.length;

  // Helper to get pickup name for an order
  const getPickupName = (order: Order): string => {
    if (!order.pickup_id) return 'Legacy Order';
    const pickup = pickups.find(p => p.id === order.pickup_id);
    return pickup ? formatPickupDate(pickup.pickup_date) : 'Unknown Pickup';
  };

  const getConfirmationMessage = () => {
    if (confirmAction?.type === 'single') {
      return 'Are you sure you want to mark this order as completed?';
    } else if (confirmAction?.type === 'bulk') {
      return `Are you sure you want to mark ${selectedOrders.size} order(s) as completed?`;
    }
    return '';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={handleConfirmComplete}
        title="Confirm Completion"
        message={getConfirmationMessage()}
        confirmText="Mark Complete"
        isProcessing={updatingStatus !== null}
      />

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
          <button
            onClick={printOpenOrders}
            className="flex items-center justify-center gap-2 bg-purple-600 border-1 border-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-md cursor-pointer"
          >
            <FiPrinter size={18} />
            Print Open Orders
          </button>
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
              <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Open Orders</p>
                </div>
                <button
                  onClick={() => {
                    exportToCSV('open');
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FiDownload size={16} />
                  <span>Export Open Orders (CSV)</span>
                </button>
                <button
                  onClick={() => {
                    exportToExcel('open');
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-100"
                >
                  <FiDownload size={16} />
                  <span>Export Open Orders (Excel)</span>
                </button>
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Completed Orders</p>
                </div>
                <button
                  onClick={() => {
                    exportToCSV('completed');
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FiDownload size={16} />
                  <span>Export Completed Orders (CSV)</span>
                </button>
                <button
                  onClick={() => {
                    exportToExcel('completed');
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors rounded-b-xl flex items-center gap-2"
                >
                  <FiDownload size={16} />
                  <span>Export Completed Orders (Excel)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-accent-gold/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-brown" size={20} />
            <label className="font-semibold text-brown">Filter by Pickup:</label>
          </div>
          <select
            value={selectedPickupFilter}
            onChange={(e) => setSelectedPickupFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-4 py-2 border border-accent-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-brown"
          >
            <option value="all">All Pickups</option>
            <option value="no-pickup">Legacy Orders (No Pickup)</option>
            {pickups.map(pickup => (
              <option key={pickup.id} value={pickup.id}>
                {formatPickupDate(pickup.pickup_date)} - {pickup.pickup_location}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="w-5 h-5 rounded border-brown/30 text-accent-gold focus:ring-accent-gold cursor-pointer"
            />
            <span className="font-medium text-brown">Show Only Open Orders</span>
          </label>
        </div>
      </div>

      {openOrders.length > 0 && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-accent-gold/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allOpenSelected}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-brown/30 text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <span className="font-medium text-brown">
                  Select All Open Orders ({openOrders.length})
                </span>
              </label>
            </div>
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-brown/70 font-medium">
                  {selectedOrders.size} order(s) selected
                </span>
                <button
                  onClick={requestBulkComplete}
                  disabled={updatingStatus !== null}
                  className="px-4 py-2 rounded-lg font-semibold transition-colors duration-300 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 cursor-pointer"
                >
                  {updatingStatus === 'bulk' ? 'Completing...' : 'Mark Selected Complete'}
                </button>
                <button
                  onClick={() => setSelectedOrders(new Set())}
                  className="px-4 py-2 rounded-lg font-semibold transition-colors duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          <p className="mt-4 text-brown/70">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-brown/70 text-xl">No open orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border transition-all duration-200 ${selectedOrders.has(order.id!) ? 'border-green-400 border-2' : 'border-accent-gold/20'}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-start gap-3">
                  {order.status === 'open' && (
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id!)}
                      onChange={() => toggleOrderSelection(order.id!)}
                      className="mt-1 w-5 h-5 rounded border-brown/30 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-serif font-bold text-brown mb-2">Order #{order.id?.slice(-8)}</h3>
                    <p className="text-brown/70">Placed on {formatDate(order.created_at)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <FiCalendar size={14} className="text-brown/50" />
                      <span className="text-sm font-medium text-brown/70">
                        {getPickupName(order)}
                      </span>
                    </div>
                  </div>
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
                    <p className="text-brown font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brown/70 mb-1">Email</p>
                    <p className="text-brown font-medium">{order.customer_email}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-brown/70 mb-2">📍 Pickup Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-brown/60">Pickup Date</p>
                      <p className="text-brown font-medium">{formatPickupDate(order.pickup_date)}</p>
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
              {order.status === 'open' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => requestSingleComplete(order.id!)}
                    disabled={updatingStatus === order.id}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors duration-300 cursor-pointer bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
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