import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getPrice } from '@/lib/utils';

const OrderSuccess = () => {
  const location = useLocation();
  const orderData = location.state?.orderData;

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Order not found</h1>
          <Link to="/">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-blue-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
              নিত্য বাজার
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
              Order Confirmed!
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-2">Thank you for your purchase</p>
          <p className="text-gray-400">Your order has been successfully placed and is being processed, আপনার অর্ডার টি কনফার্ম করা হলো, ধন্যবাদ! </p>
        </div>

        {/* Order Details */}
        <Card className="bg-gray-800/30 backdrop-blur-lg border border-blue-500/20 mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Order Details</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Number:</span>
                    <span className="text-white font-semibold">{orderData.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Date:</span>
                    <span className="text-white">{new Date(orderData.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-blue-400 font-bold">৳{new Intl.NumberFormat('en-US').format(orderData.pricing.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="text-white">
                      {orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : `bKash: ${orderData.bkashNumber}`}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Delivery Information</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery Area:</span>
                    <span className="text-white">{orderData.customer.deliveryArea}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white">{orderData.customer.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Delivery:</span>
                    <span className="text-white">{estimatedDelivery}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery Charge:</span>
                    <span className="text-blue-400">৳{orderData.pricing.deliveryCharge}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="bg-gray-800/30 backdrop-blur-lg border border-blue-500/20 mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">What happens next?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Order Processing</h3>
                <p className="text-gray-400 text-sm">We're preparing your items for shipment</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">In Transit</h3>
                <p className="text-gray-400 text-sm">Your order is on its way to you</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Delivery Updates</h3>
                <p className="text-gray-400 text-sm">We'll send you tracking information via SMS</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="bg-gray-800/30 backdrop-blur-lg border border-blue-500/20 mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Your Items</h2>
            <div className="space-y-4">
              {orderData.items.map((item: any, index: number) => {
                const price = getPrice(item);
                
                return (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{item.name}</h3>
                      <p className="text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-green-400 font-bold">৳{new Intl.NumberFormat('en-US').format(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-12 p-6 bg-gray-800/20 rounded-lg">
          <p className="text-gray-400 mb-2">Need help with your order?</p>
          <p className="text-white">Contact us at <span className="text-green-400"> নিত্য বাজার ফেসবুক পেজ</span> or call <span className="text-green-400">📌 WhatsApp: 01706003435</span></p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
