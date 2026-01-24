import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, Order, createAdminOrder, OrderItem } from '../../lib/products-supabase';
import { getPickupInfo } from '../../lib/settings-supabase';
import { getAllPickups, Pickup, getPickupProducts, PickupProduct } from '../../lib/pickups-supabase';
import { FiRefreshCw, FiDownload, FiChevronDown, FiX, FiPrinter, FiCalendar, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { formatDateEST, formatTimestampEST, getTodayEST } from '../../lib/timezone';

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
          <h3 className="text-xl font-bold text-brown">{title}</h3>
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
  const [selectedPickupFilter, setSelectedPickupFilter] = useState<string>('all');
  const [pickupTime, setPickupTime] = useState<string>('9:00 AM');
  const [pickupLocation, setPickupLocation] = useState<string>('Sour The Bakery');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string } | null>(null);

  // Manual order state
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [addOrderPickupId, setAddOrderPickupId] = useState<string>('');
  const [addOrderProducts, setAddOrderProducts] = useState<PickupProduct[]>([]);
  const [addOrderItems, setAddOrderItems] = useState<Record<string, number>>({});
  const [addOrderCustomerName, setAddOrderCustomerName] = useState('');
  const [addOrderCustomerEmail, setAddOrderCustomerEmail] = useState('');
  const [addOrderLoading, setAddOrderLoading] = useState(false);
  const [addOrderError, setAddOrderError] = useState<string | null>(null);

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
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const requestSingleComplete = (orderId: string) => {
    setConfirmAction({ orderId });
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!confirmAction) return;

    try {
      await handleStatusUpdate(confirmAction.orderId, 'completed');
    } catch (err) {
      setError('Failed to complete order');
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  // Manual order functions
  const handlePickupSelectForOrder = async (pickupId: string) => {
    setAddOrderPickupId(pickupId);
    setAddOrderItems({});
    setAddOrderError(null);

    if (pickupId) {
      try {
        const products = await getPickupProducts(pickupId);
        setAddOrderProducts(products);
      } catch (err) {
        setAddOrderError('Failed to load products for this pickup');
        setAddOrderProducts([]);
      }
    } else {
      setAddOrderProducts([]);
    }
  };

  const handleAddOrderItemChange = (productId: string, delta: number) => {
    setAddOrderItems(prev => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newValue };
    });
  };

  const calculateAddOrderTotal = () => {
    return Object.entries(addOrderItems).reduce((total, [productId, quantity]) => {
      const product = addOrderProducts.find(p => p.product_id === productId);
      if (product) {
        const price = parseFloat(product.price.replace('$', ''));
        return total + (price * quantity);
      }
      return total;
    }, 0);
  };

  const resetAddOrderForm = () => {
    setShowAddOrder(false);
    setAddOrderPickupId('');
    setAddOrderProducts([]);
    setAddOrderItems({});
    setAddOrderCustomerName('');
    setAddOrderCustomerEmail('');
    setAddOrderError(null);
  };

  const handleSubmitManualOrder = async () => {
    if (!addOrderPickupId || !addOrderCustomerName.trim() || !addOrderCustomerEmail.trim()) {
      setAddOrderError('Please fill in all required fields');
      return;
    }

    const itemsArray = Object.entries(addOrderItems);
    if (itemsArray.length === 0) {
      setAddOrderError('Please add at least one item to the order');
      return;
    }

    setAddOrderLoading(true);
    setAddOrderError(null);

    try {
      const pickup = pickups.find(p => p.id === addOrderPickupId);
      if (!pickup) {
        throw new Error('Pickup not found');
      }

      const orderItems: OrderItem[] = itemsArray.map(([productId, quantity]) => {
        const product = addOrderProducts.find(p => p.product_id === productId);
        return {
          productId,
          productName: product?.product?.name || 'Unknown Product',
          quantity,
          price: product?.price || '$0.00'
        };
      });

      await createAdminOrder({
        customer_name: addOrderCustomerName.trim(),
        customer_email: addOrderCustomerEmail.trim().toLowerCase(),
        items: orderItems,
        total: calculateAddOrderTotal(),
        pickup_id: addOrderPickupId,
        pickup_date: pickup.pickup_date
      });

      resetAddOrderForm();
      fetchOrders();
    } catch (err: any) {
      setAddOrderError(err.message || 'Failed to create order');
    } finally {
      setAddOrderLoading(false);
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
    return formatTimestampEST(timestamp);
  };

  const formatPickupDate = (pickupDate: string | undefined) => {
    if (!pickupDate) return 'TBD';
    return formatDateEST(pickupDate, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExportData = (filterType: 'open' | 'completed') => {
    let exportOrders = orders.filter(order => order.status === filterType);

    // Apply pickup filter if set
    if (selectedPickupFilter !== 'all') {
      if (selectedPickupFilter === 'no-pickup') {
        exportOrders = exportOrders.filter(order => !order.pickup_id);
      } else {
        exportOrders = exportOrders.filter(order => order.pickup_id === selectedPickupFilter);
      }
    }

    if (exportOrders.length === 0) {
      const filterDesc = selectedPickupFilter === 'all' ? '' : ' for selected pickup';
      alert(`No ${filterType} orders${filterDesc} to export`);
      return null;
    }

    const filteredOrders = exportOrders;

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

    const fileName = `${filterType}-orders-${getTodayEST()}.xlsx`;
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
    link.setAttribute('download', `${filterType}-orders-${getTodayEST()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printOpenOrders = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to print');
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
          <title>Open Orders - ${formatDateEST(getTodayEST())}</title>
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
          ${filteredOrders.map(order => `
            <div class="receipt">
              <div class="receipt-content">
                <div class="header">
                  <h1>SOUR The Bakery</h1>
                  <div class="tagline">Lets get SOUR</div>
                </div>

                <div class="order-info">
                  <div class="order-number">ORDER #${order.id?.slice(-8)}</div>
                  <div class="info-line">${formatTimestampEST(new Date().toISOString())}</div>
                </div>

                <div class="divider"></div>

                <div class="section-title">CUSTOMER</div>
                <div class="customer-line">${order.customer_name}</div>
                <div class="customer-line">${order.customer_email}</div>

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
                  <div>Questions? sourthebakeryllc@gmail.com</div>
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


  // Filter to only show open orders
  let filteredOrders = orders.filter(order => order.status === 'open');

  // Apply pickup filter
  if (selectedPickupFilter !== 'all') {
    if (selectedPickupFilter === 'no-pickup') {
      filteredOrders = filteredOrders.filter(order => !order.pickup_id);
    } else {
      filteredOrders = filteredOrders.filter(order => order.pickup_id === selectedPickupFilter);
    }
  }

  // Helper to get pickup name for an order
  const getPickupName = (order: Order): string => {
    if (!order.pickup_id) return 'Legacy Order';
    const pickup = pickups.find(p => p.id === order.pickup_id);
    return pickup ? formatPickupDate(pickup.pickup_date) : 'Unknown Pickup';
  };

  const getConfirmationMessage = () => {
    return 'Are you sure you want to mark this order as completed?';
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
          <h1 className="text-4xl font-bold text-brown mb-2">Order Management</h1>
          <p className="text-brown/70">View and manage customer orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 bg-accent-gold border-2 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer"
          >
            <FiRefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddOrder(!showAddOrder)}
            className="flex items-center justify-center gap-2 bg-blue-600 border-2 border-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md cursor-pointer"
          >
            <FiShoppingCart size={18} />
            {showAddOrder ? 'Cancel' : 'Add'}
          </button>
          <button
            onClick={printOpenOrders}
            className="flex items-center justify-center gap-2 bg-purple-600 border-2 border-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-md cursor-pointer"
          >
            <FiPrinter size={18} />
            Print
          </button>
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center justify-center gap-2 bg-green-600 border-1 border-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-md cursor-pointer w-full sm:w-auto"
            >
              <FiDownload size={18} />
              Export
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

      {/* Manual Order Form */}
      {showAddOrder && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200">
          <h3 className="text-xl font-bold text-brown mb-4 flex items-center gap-2">
            <FiShoppingCart className="text-blue-600" />
            Add Manual Order
          </h3>

          {addOrderError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{addOrderError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-brown font-semibold mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={addOrderCustomerName}
                  onChange={(e) => setAddOrderCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full border border-accent-gold/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                />
              </div>
              <div>
                <label className="block text-brown font-semibold mb-2">Customer Email *</label>
                <input
                  type="email"
                  value={addOrderCustomerEmail}
                  onChange={(e) => setAddOrderCustomerEmail(e.target.value)}
                  placeholder="Enter customer email"
                  className="w-full border border-accent-gold/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                />
              </div>
              <div>
                <label className="block text-brown font-semibold mb-2">Select Pickup *</label>
                <select
                  value={addOrderPickupId}
                  onChange={(e) => handlePickupSelectForOrder(e.target.value)}
                  className="w-full border border-accent-gold/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-gold"
                >
                  <option value="">Select a pickup event...</option>
                  {pickups.map(pickup => (
                    <option key={pickup.id} value={pickup.id}>
                      {formatPickupDate(pickup.pickup_date)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products */}
            <div>
              <label className="block text-brown font-semibold mb-2">Products</label>
              {!addOrderPickupId ? (
                <p className="text-brown/50 italic">Select a pickup to see available products</p>
              ) : addOrderProducts.length === 0 ? (
                <p className="text-brown/50 italic">No products available for this pickup</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-accent-gold/20 rounded-lg p-3">
                  {addOrderProducts.map(pp => (
                    <div key={pp.product_id} className="flex items-center justify-between bg-cream/50 rounded-lg p-2">
                      <div className="flex-1">
                        <span className="font-medium text-brown">{pp.product?.name}</span>
                        <span className="text-brown/60 ml-2">{pp.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddOrderItemChange(pp.product_id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {addOrderItems[pp.product_id] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOrderItemChange(pp.product_id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-accent-gold rounded-full hover:bg-accent-gold/80 transition-colors"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Submit */}
          <div className="mt-6 pt-4 border-t border-accent-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-lg font-semibold text-brown">
              Total: ${calculateAddOrderTotal().toFixed(2)}
              {Object.keys(addOrderItems).length > 0 && (
                <span className="text-sm font-normal text-brown/60 ml-2">
                  ({Object.values(addOrderItems).reduce((a, b) => a + b, 0)} items)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetAddOrderForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitManualOrder}
                disabled={addOrderLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 border-2 border-blue-700"
              >
                {addOrderLoading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-accent-gold/20 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 shrink-0">
            <FiCalendar className="text-brown" size={20} />
            <label className="font-semibold text-brown whitespace-nowrap">Filter by Pickup:</label>
          </div>
          <select
            value={selectedPickupFilter}
            onChange={(e) => setSelectedPickupFilter(e.target.value)}
            className="w-full sm:w-auto mx-2 px-4 py-2 border border-accent-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold text-brown max-w-full"
          >
            <option value="all">All Pickups</option>
            <option value="no-pickup">Legacy Orders (No Pickup)</option>
            {pickups.map(pickup => (
              <option key={pickup.id} value={pickup.id}>
                {formatPickupDate(pickup.pickup_date)}
              </option>
            ))}
          </select>
        </div>
      </div>

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
            <div key={order.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-brown mb-2">Order #{order.id?.slice(-8)}</h3>
                  <p className="text-brown/70">Placed on {formatDate(order.created_at)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <FiCalendar size={14} className="text-brown/50" />
                    <span className="text-sm font-medium text-brown/70">
                      {getPickupName(order)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-accent-gold">Total: ${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mb-6">
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