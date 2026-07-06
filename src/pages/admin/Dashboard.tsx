import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  Percent,
  MapPin,
  Phone,
  Mail,
  Users,
  Loader2,
} from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { database } from '@/lib/firebase';
import { get, onValue, ref, remove, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getProductImage, getPrice } from '@/lib/utils';
import {
  formatOrderDate,
  normalizeCustomer,
  normalizeOrderItems,
  parseOrderDate,
} from '@/lib/orderUtils';
import NotificationSettings from '@/components/admin/NotificationSettings';
import OrderNotificationBanner from '@/components/admin/OrderNotificationBanner';
import { useAdminOrderNotifications } from '@/hooks/useAdminOrderNotifications';
import AdminLayout, { type AdminTab } from '@/components/admin/AdminLayout';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import ProductEditDialog, { type EditableProduct } from '@/components/admin/ProductEditDialog';

const AddProduct = React.lazy(() => import('./AddProduct'));

interface Order {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    deliveryArea: string;
  };
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    offerPrice?: number;
    mainPrice?: number;
  }>;
  paymentMethod: string;
  bkashNumber?: string;
  pricing: {
    subtotal: number;
    deliveryCharge: number;
    total: number;
  };
  status: string;
  orderDate: string;
  orderNumber: string;
}

interface Product {
  id: string;
  name: string;
  mainPrice: number;
  mainImage: string;
  mainImageUrl?: string;
  originalPrice?: number;
  discount?: number;
  category: string;
  stock: number;
  image: string;
  description?: string;
  inStock: boolean;
  featured?: boolean;
  rating: number;
  offerPrice?: number | null;
}

type ConfirmAction =
  | { type: 'delete-product'; id: string }
  | { type: 'delete-order'; id: string }
  | { type: 'delete-all-products' };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const orderCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const openOrderDetails = useCallback((orderId: string) => {
    setActiveTab('orders');
    setHighlightedOrderId(orderId);
    setTimeout(() => {
      orderCardRefs.current[orderId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, []);

  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    inAppAlert,
    dismissAlert,
    openAlertOrder,
    sendTestNotification,
    fcmReady,
  } = useAdminOrderNotifications(orders, openOrderDetails);

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
    [orders]
  );

  useEffect(() => {
    let unsubOrders: (() => void) | undefined;
    let unsubProducts: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubOrders?.();
      unsubProducts?.();
      if (user) {
        setIsAuthenticated(true);
        unsubOrders = loadOrders();
        unsubProducts = loadProductsRealtime();
        setLoading(false);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        navigate('/admin/login');
      }
    });

    return () => {
      unsubAuth();
      unsubOrders?.();
      unsubProducts?.();
    };
  }, [navigate]);

  const loadOrders = () => {
    const unsubscribe = onValue(
      ref(database, 'orders'),
      (snapshot) => {
        const value = snapshot.val() || {};
        const ordersData = Object.entries(value)
          .map(([id, data]) => ({
            id,
            ...(data as Record<string, unknown>),
            customer: normalizeCustomer((data as Record<string, unknown>).customer),
            items: normalizeOrderItems((data as Record<string, unknown>).items),
          }))
          .filter((order) => order.pricing && typeof order.pricing.total === 'number') as Order[];
        setOrders(
          ordersData.sort(
            (a, b) => parseOrderDate(String(b.orderDate || '')).getTime() - parseOrderDate(String(a.orderDate || '')).getTime()
          )
        );
      },
      (err) => {
        console.error('Error loading orders:', err);
        toast({
          title: 'Orders unavailable',
          description: 'Could not load orders. Check your connection.',
          variant: 'destructive',
        });
      }
    );
    return unsubscribe;
  };

  const loadProductsRealtime = () => {
    const unsubscribe = onValue(
      ref(database, 'products'),
      (snapshot) => {
        const value = snapshot.val() || {};
        setAdminProducts(
          Object.entries(value).map(([id, data]) => ({ id, ...(data as Record<string, unknown>) })) as Product[]
        );
      },
      (err) => {
        console.error('Error loading products:', err);
        toast({
          title: 'Products unavailable',
          description: 'Could not load products.',
          variant: 'destructive',
        });
      }
    );
    return unsubscribe;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
      toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ title: 'Error', description: 'Could not sign out.', variant: 'destructive' });
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.type === 'delete-product') {
        setDeletingProductId(confirmAction.id);
        await remove(ref(database, `products/${confirmAction.id}`));
        toast({ title: 'Product deleted', description: 'Product removed from the store.' });
      } else if (confirmAction.type === 'delete-order') {
        await remove(ref(database, `orders/${confirmAction.id}`));
        toast({ title: 'Order deleted', description: 'Order has been removed.' });
      } else if (confirmAction.type === 'delete-all-products') {
        await remove(ref(database, 'products'));
        toast({ title: 'All products deleted', description: 'All products removed from Realtime Database.' });
      }
      setConfirmAction(null);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Action failed. Please try again.', variant: 'destructive' });
    } finally {
      setConfirmLoading(false);
      setDeletingProductId(null);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      await update(ref(database, `orders/${orderId}`), { status });
      toast({ title: 'Order updated', description: `Status changed to ${status}.` });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Error', description: 'Failed to update order.', variant: 'destructive' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      mainPrice: (product as Product & { mainPrice?: number }).mainPrice ?? getPrice(product as never),
      offerPrice: product.offerPrice,
      description: product.description,
      inStock: product.inStock,
      stock: product.stock,
    });
    setEditOpen(true);
  };

  const filteredAdminProducts = adminProducts.filter(
    (product) => product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductThumb = (product: Product) =>
    getProductImage(product as unknown as Record<string, unknown>);

  if (loading) {
    return (
      <div className="admin-shell min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] via-[#fdf6f0] to-[#fff]">
        <div className="text-center px-4">
          <Loader2 className="w-12 h-12 animate-spin text-premium-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total ?? 0), 0);
  const totalDiscountSavings = adminProducts.reduce((sum, product) => {
    if (product.originalPrice && (product as Product & { price?: number }).price) {
      return (
        sum +
        (product.originalPrice - (product as Product & { price: number }).price) *
          product.stock
      );
    }
    return sum;
  }, 0);

  const stats = [
    { title: 'Total Products', value: adminProducts.length, icon: Package },
    { title: 'Total Orders', value: orders.length, icon: ShoppingCart },
    { title: 'Revenue', value: `৳${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { title: 'Discount Savings', value: `৳${totalDiscountSavings.toFixed(2)}`, icon: Percent },
  ];

  const confirmCopy = (() => {
    if (!confirmAction) return { title: '', description: '' };
    if (confirmAction.type === 'delete-product') {
      return { title: 'Delete product?', description: 'This cannot be undone.' };
    }
    if (confirmAction.type === 'delete-order') {
      return { title: 'Delete order?', description: 'This order will be permanently removed.' };
    }
    return {
      title: 'Delete all products?',
      description: 'Every product in Firestore will be removed. This cannot be undone.',
    };
  })();

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      ordersCount={orders.length}
      newOrdersBadge={inAppAlert ? 1 : pendingOrdersCount}
      topBanner={
        inAppAlert ? (
          <OrderNotificationBanner
            alert={inAppAlert}
            onView={openAlertOrder}
            onDismiss={dismissAlert}
          />
        ) : undefined
      }
    >
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-lg border border-premium-200/30">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm truncate">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-premium-700 truncate">{stat.value}</p>
                    </div>
                    <div className="bg-premium-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-premium-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-white/80 border border-premium-200/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-premium-800 text-base">Top categories</CardTitle>
              </CardHeader>
              <CardContent>
                {['Headphones', 'Selfie Sticks', 'Microphones', 'Toys'].map((category) => (
                  <div key={category} className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-700">{category}</span>
                    <span className="text-premium-600 font-medium">
                      {adminProducts.filter((p) => (p as Product & { category?: string }).category === category).length}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/80 border border-premium-200/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-premium-800 text-base">Recent orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.slice(0, 4).map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    className="w-full flex justify-between items-center py-2.5 text-sm text-left touch-manipulation min-h-11"
                    onClick={() => openOrderDetails(order.id)}
                  >
                    <span className="text-gray-700 truncate pr-2">{order.orderNumber}</span>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {order.status}
                    </Badge>
                  </button>
                ))}
                {orders.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">No orders yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <NotificationSettings
            settings={notificationSettings}
            onChange={updateNotificationSettings}
            onTest={sendTestNotification}
            fcmReady={fcmReady}
          />
        </div>
      )}

      {activeTab === 'products' && (
        <Card className="bg-white/90 border border-premium-200/40 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-premium-800 text-lg">
              Products ({adminProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products…"
                className="min-h-11 w-full"
              />
              <Button
                type="button"
                variant="outline"
                className="border-red-400 text-red-500 hover:bg-red-50 min-h-11 w-full sm:w-auto touch-manipulation"
                onClick={() => setConfirmAction({ type: 'delete-all-products' })}
              >
                Delete all products
              </Button>
            </div>

            <div className="md:hidden space-y-3">
              {filteredAdminProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-gray-200 bg-white p-3 flex gap-3"
                >
                  <img
                    src={getProductThumb(product)}
                    alt=""
                    className="w-20 h-20 object-contain rounded-lg bg-gray-50 shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-premium-600 font-semibold text-sm mt-1">
                      ৳{new Intl.NumberFormat('en-US').format(getPrice(product as never))}
                    </p>
                    <p className="text-xs mt-1">
                      {product.inStock ? (
                        <span className="text-green-600">In stock</span>
                      ) : (
                        <span className="text-red-500">Out of stock</span>
                      )}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-10 flex-1 touch-manipulation"
                        onClick={() => openEditProduct(product)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-10 flex-1 border-red-300 text-red-500 touch-manipulation"
                        disabled={deletingProductId === product.id}
                        onClick={() => setConfirmAction({ type: 'delete-product', id: product.id })}
                      >
                        {deletingProductId === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAdminProducts.length === 0 && (
                <p className="text-center text-gray-500 py-8 text-sm">No products found.</p>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto -mx-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Price</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdminProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="p-2">
                        <img
                          src={getProductThumb(product)}
                          alt=""
                          className="w-14 h-14 object-contain rounded-lg"
                          loading="lazy"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>
                      <TableCell className="text-premium-600 font-semibold">
                        ৳{new Intl.NumberFormat('en-US').format(getPrice(product as never))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.inStock ? 'default' : 'destructive'}>
                          {product.inStock ? 'In stock' : 'Out'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 touch-manipulation"
                            onClick={() => openEditProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 border-red-300 text-red-500 touch-manipulation"
                            disabled={deletingProductId === product.id}
                            onClick={() =>
                              setConfirmAction({ type: 'delete-product', id: product.id })
                            }
                          >
                            {deletingProductId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card className="bg-white/90 border border-premium-200/40">
          <CardHeader>
            <CardTitle className="text-premium-800 text-lg flex items-center gap-2">
              Orders ({orders.length})
              {pendingOrdersCount > 0 && (
                <Badge className="bg-green-600">{pendingOrdersCount} pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders.map((order) => {
              const customer = order.customer ?? normalizeCustomer(null);
              const items = order.items?.length ? order.items : normalizeOrderItems(null);
              return (
              <Card
                key={order.id}
                id={`order-card-${order.id}`}
                ref={(el) => {
                  orderCardRefs.current[order.id] = el;
                }}
                className={`border ${
                  highlightedOrderId === order.id
                    ? 'border-green-600 ring-2 ring-green-400/40'
                    : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-semibold text-premium-700 mb-2">Order</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>#</strong> {order.orderNumber}
                        </p>
                        <p className="text-gray-600">
                          {formatOrderDate(order.orderDate)} ·{' '}
                          <Badge className="capitalize">{order.status || 'pending'}</Badge>
                        </p>
                        <p className="text-gray-600">
                          Payment:{' '}
                          {order.paymentMethod === 'cod'
                            ? 'Cash on delivery'
                            : `bKash ${order.bkashNumber ?? ''}`}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Customer</h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2 min-h-8">
                          <Users className="w-4 h-4 shrink-0 text-gray-400" />
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="flex items-center gap-2 min-h-8 break-all">
                          <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone ? (
                          <div className="flex items-center gap-2 min-h-8">
                            <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                            <a href={`tel:${customer.phone}`} className="text-premium-600 touch-manipulation">
                              {customer.phone}
                            </a>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                          <div>
                            <p>{customer.address}</p>
                            {customer.deliveryArea ? (
                              <p className="text-premium-600">{customer.deliveryArea}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">Items</h4>
                      <div className="space-y-1 text-sm">
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between gap-2">
                            <span className="truncate">
                              {item.name} ×{item.quantity}
                            </span>
                            <span className="shrink-0">
                              ৳
                              {new Intl.NumberFormat('en-US').format(
                                getPrice(item) * item.quantity
                              )}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
                          <span>Total</span>
                          <span>৳{order.pricing?.total ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 flex-1 touch-manipulation"
                      disabled={
                        order.status === 'delivered' || updatingOrderId === order.id
                      }
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                    >
                      {updatingOrderId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Delivered
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 flex-1 touch-manipulation"
                      disabled={
                        order.status === 'shipped' ||
                        order.status === 'delivered' ||
                        updatingOrderId === order.id
                      }
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Shipped
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-11 flex-1 border-red-300 text-red-500 touch-manipulation"
                      onClick={() => setConfirmAction({ type: 'delete-order', id: order.id })}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-12">No orders yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className={activeTab === 'add-product' ? undefined : 'hidden'} aria-hidden={activeTab !== 'add-product'}>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-premium-600" />
            </div>
          }
        >
          <AddProduct />
        </Suspense>
      </div>

      <AdminConfirmDialog
        open={!!confirmAction}
        title={confirmCopy.title}
        description={confirmCopy.description}
        destructive
        loading={confirmLoading}
        confirmLabel="Delete"
        onConfirm={runConfirmAction}
        onOpenChange={(open) => !open && !confirmLoading && setConfirmAction(null)}
      />

      <ProductEditDialog
        product={editingProduct}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
