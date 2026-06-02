import React from 'react';
import { Bell, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InAppOrderAlert } from '@/hooks/useAdminOrderNotifications';

interface OrderNotificationBannerProps {
  alert: InAppOrderAlert;
  onView: () => void;
  onDismiss: () => void;
}

const OrderNotificationBanner: React.FC<OrderNotificationBannerProps> = ({
  alert,
  onView,
  onDismiss,
}) => (
  <div
    className="fixed top-20 left-4 right-4 z-[100] mx-auto max-w-lg animate-fade-up"
    role="alert"
  >
    <div className="rounded-2xl border border-orange-300 bg-white shadow-2xl shadow-orange-500/20 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 flex items-center justify-between">
        <span className="text-white font-semibold text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          🛒 New Order Received
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/90 hover:text-white p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-2 text-sm text-gray-800">
        <p>
          <strong>Customer:</strong> {alert.customerName}
        </p>
        <p>
          <strong>Amount:</strong> ৳{alert.amount}
        </p>
        <p>
          <strong>Order ID:</strong> #{alert.orderNumber}
        </p>
        <Button
          type="button"
          onClick={onView}
          className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Order Details
        </Button>
      </div>
    </div>
  </div>
);

export default OrderNotificationBanner;
