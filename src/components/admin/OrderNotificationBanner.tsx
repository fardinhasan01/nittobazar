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
    className="fixed left-3 right-3 z-[100] mx-auto max-w-lg animate-fade-up safe-top"
    style={{ top: 'calc(3.75rem + env(safe-area-inset-top, 0px))' }}
    role="alert"
  >
    <div className="rounded-2xl border border-green-300 bg-white shadow-2xl shadow-green-600/20 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 flex items-center justify-between">
        <span className="text-white font-semibold text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          🛒 New Order Received
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/90 hover:text-white p-2 min-h-10 min-w-10 touch-manipulation flex items-center justify-center"
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
          className="w-full mt-2 min-h-12 bg-green-700 hover:bg-green-800 text-white rounded-xl touch-manipulation"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Order Details
        </Button>
      </div>
    </div>
  </div>
);

export default OrderNotificationBanner;
