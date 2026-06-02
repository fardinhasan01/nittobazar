import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  LogOut,
  Plus,
  CheckCircle,
  Percent,
  TrendingUp,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import AddProduct from './AddProduct';
import { getProductImageUrl, getPrice } from '@/lib/utils';
import NotificationSettings from '@/components/admin/NotificationSettings';
import OrderNotificationBanner from '@/components/admin/OrderNotificationBanner';
import { useAdminOrderNotifications } from '@/hooks/useAdminOrderNotifications';

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
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mainPrice, setMainPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    originalPrice: '',
    discount: '',
    category: 'Headphones',
    stock: '',
    description: '',
    image: null as File | null,
    additionalImages: [] as File[],
    videoUrl: '',
    featured: false,
    rating: '4.5'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
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

  const tagOptions = [
    { value: 'Hot', label: 'Hot 🔥' },
    { value: 'Exclusive', label: 'Exclusive 🌟' },
    { value: 'Trending', label: 'Trending 💹' },
  ];

  useEffect(() => {
    // Check Firebase authentication
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const unsubOrders = loadOrders();
        const unsubProducts = loadProductsRealtime();
        setLoading(false);
        // Cleanup listeners when auth changes away from logged-in state
        return () => {
          unsubOrders && unsubOrders();
          unsubProducts && unsubProducts();
        };
      } else {
        setIsAuthenticated(false);
        setLoading(false);
        navigate('/admin/login');
      }
    });

    return () => {
      unsubAuth();
    };
  }, [navigate]);

  const loadOrders = () => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Order;
      }).filter((order: any) => {
        return order.pricing && typeof order.pricing.total === 'number';
      });
      
      setOrders(ordersData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    });

    return unsubscribe;
  };

  const loadProductsRealtime = () => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setAdminProducts(productsData);
    }, (err) => {
      console.error('Error loading products:', err);
    });
    return unsubscribe;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewProduct(prev => ({ ...prev, [name]: checked }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainImageFile(e.target.files[0]);
      setMainImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAdditionalImageFiles(filesArray);
      setAdditionalImagePreviews(filesArray.map(file => URL.createObjectURL(file)));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setVideoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setTags(selected);
  };

  const validateProduct = () => {
    if (!newProduct.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return false;
    }

    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return false;
    }

    if (!newProduct.stock || isNaN(Number(newProduct.stock)) || Number(newProduct.stock) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid stock quantity",
        variant: "destructive"
      });
      return false;
    }

    if (newProduct.originalPrice && (isNaN(Number(newProduct.originalPrice)) || Number(newProduct.originalPrice) <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid original price",
        variant: "destructive"
      });
      return false;
    }

    if (newProduct.discount && (isNaN(Number(newProduct.discount)) || Number(newProduct.discount) < 0 || Number(newProduct.discount) > 100)) {
      toast({
        title: "Validation Error",
        description: "Discount must be between 0 and 100",
        variant: "destructive"
      });
      return false;
    }

    if (newProduct.videoUrl && !/^https?:\/\//.test(newProduct.videoUrl)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid video URL (http/https)",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!name.trim() || !mainPrice.trim() || !mainImageFile) {
      toast({ title: '❌ Error', description: 'Please fill in all required fields (name, main price, main image)', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      // Upload main image
      let mainImageUrl = '';
      if (mainImageFile) {
        const imageRef = ref(storage, `products/${Date.now()}_${mainImageFile.name}`);
        const snap = await uploadBytes(imageRef, mainImageFile);
        mainImageUrl = await getDownloadURL(snap.ref);
      }
      // Upload additional images
      let additionalImageUrls: string[] = [];
      for (const file of additionalImageFiles) {
        const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(imgRef, file);
        const url = await getDownloadURL(snap.ref);
        additionalImageUrls.push(url);
      }
      // Upload video
      let videoUrlFinal = '';
      if (videoFile) {
        const videoRef = ref(storage, `products/videos/${Date.now()}_${videoFile.name}`);
        const snap = await uploadBytes(videoRef, videoFile);
        videoUrlFinal = await getDownloadURL(snap.ref);
      }
      const product = {
        name: name.trim(),
        description: description.trim(),
        mainPrice: parseFloat(mainPrice || "0"),
        offerPrice: offerPrice ? parseFloat(offerPrice || "0") : null,
        mainImage: mainImageUrl,
        additionalImages: additionalImageUrls,
        videoUrl: videoUrlFinal,
        tags,
        createdAt: serverTimestamp()
      };
      console.log('Submitting product:', product);
      await addDoc(collection(db, 'products'), product);
      toast({ title: '✅ Success', description: 'Product added successfully!' });
      setName(''); setDescription(''); setMainPrice(''); setOfferPrice(''); setMainImageFile(null); setMainImagePreview(null); setAdditionalImageFiles([]); setAdditionalImagePreviews([]); setVideoFile(null); setVideoPreview(null); setTags([]);
      // Realtime listener will update product list automatically
    } catch (error) {
      console.error('Error adding product:', error);
      toast({ title: '❌ Error', description: 'Failed to add product', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        await loadProducts();
        toast({
          title: "Product Deleted",
          description: "Product has been removed from the store.",
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Failed to delete product.",
          variant: "destructive"
        });
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        toast({
          title: "Order Deleted",
          description: "Order has been removed.",
        });
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const deleteAllProducts = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products? This cannot be undone.')) return;
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const batchDeletes = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'products', docSnap.id)));
      await Promise.all(batchDeletes);
      toast({ title: 'All products deleted', description: 'All products have been removed from Firestore.' });
      // Realtime listener will reflect deletions
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete all products', variant: 'destructive' });
    }
  };

  const filteredAdminProducts = adminProducts.filter(product =>
    product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#fdf6f0] to-[#fff] text-[#222] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-premium-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Render nothing once we've navigated away, but avoid infinite spinner
    return null;
  }

  const totalRevenue = orders
    .filter(order => order.pricing && typeof order.pricing.total === 'number')
    .reduce((sum, order) => sum + order.pricing.total, 0);
    
  const totalDiscountSavings = adminProducts.reduce((sum, product) => {
    if (product.originalPrice && (product as any).price) {
      return sum + (product.originalPrice - (product as any).price) * (product as any).stock;
    }
    return sum;
  }, 0);

  const stats = [
    { title: "Total Products", value: adminProducts.length, icon: Package, color: "from-premium-500 to-emerald-500" },
    { title: "Total Orders", value: orders.length, icon: ShoppingCart, color: "from-emerald-500 to-green-500" },
    { title: "Revenue", value: `৳${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "from-green-600 to-emerald-600" },
    { title: "Discount Savings", value: `৳${totalDiscountSavings.toFixed(2)}`, icon: Percent, color: "from-gold-500 to-yellow-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] via-[#fdf6f0] to-[#fff] text-[#222]">
      {inAppAlert && (
        <OrderNotificationBanner
          alert={inAppAlert}
          onView={openAlertOrder}
          onDismiss={dismissAlert}
        />
      )}
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-premium-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/d3afd300-289e-412e-ab42-87bdeed21cda.png" 
                alt="AB Gadgets Logo" 
                className="w-10 h-10 mr-3 rounded-lg shadow-lg transform hover:scale-110 transition-transform duration-300"
              />
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-premium-600 to-emerald-600 bg-clip-text text-transparent mr-8">
                AB GADGETS
              </Link>
              <span className="text-gray-600">Admin Dashboard</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-400 text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/30 p-1 rounded-lg backdrop-blur-lg border border-premium-500/20">
          {['overview', 'products', 'orders', 'add-product'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md font-medium transition-all capitalize ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-premium-600 to-emerald-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-lg border border-premium-200/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{stat.title}</p>
                        <p className="text-2xl font-bold text-premium-700">{stat.value}</p>
                      </div>
                      <div className={`bg-gradient-to-r ${stat.color.replace('from-', 'from-premium-200 ').replace('to-', 'to-emerald-200 ')} w-12 h-12 rounded-full flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-premium-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/30 backdrop-blur-lg border border-premium-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {['Headphones', 'Selfie Sticks', 'Microphones', 'Toys'].map((category) => (
                    <div key={category} className="flex justify-between items-center py-2">
                      <span className="text-gray-300">{category}</span>
                      <span className="text-premium-400">{adminProducts.filter(p => (p as any).category === category).length}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/30 backdrop-blur-lg border border-premium-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex justify-between items-center py-2">
                      <span className="text-gray-300">{order.orderNumber}</span>
                      <Badge className={
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                        order.status === 'shipped' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
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

        {/* Products Tab */}
        {activeTab === 'products' && (
          <Card className="bg-gray-800/30 backdrop-blur-lg border border-premium-500/20">
            <CardHeader>
              <CardTitle className="text-white">Product Management ({adminProducts.length} products)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <Button
                  onClick={deleteAllProducts}
                  variant="outline"
                  className="border-red-400 text-red-400 hover:bg-red-400/10"
                >
                  Delete All Products
                </Button>
                <div className="w-full sm:w-80">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products"
                    className="bg-gray-700/50 border-gray-600 text-white focus:border-premium-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300 w-20">Image</TableHead>
                    <TableHead className="text-gray-300 min-w-[200px]">Name</TableHead>
                    <TableHead className="text-gray-300 w-24">Price</TableHead>
                    <TableHead className="text-gray-300 w-20">Stock</TableHead>
                    <TableHead className="text-gray-300 w-24">Status</TableHead>
                    <TableHead className="text-gray-300 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdminProducts.map((product) => (
                    <TableRow key={product.id} className="border-gray-700">
                      <TableCell className="p-2">
                        <img 
                          src={
                            product.mainImageUrl ||
                            (Array.isArray((product as any).image) ? (product as any).image[0] : (product as any).image) ||
                            "/placeholder.jpg"
                          } 
                          alt={product.name} 
                          className="w-16 h-16 object-contain rounded-lg shadow bg-premium-50"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to placeholder if any error occurs
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.jpg';
                            target.onerror = null;
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-white p-2">
                        <div className="max-w-[200px]">
                          <div className="text-sm font-medium truncate">{product.name}</div>
                          {product.featured && <Badge className="bg-premium-500/20 text-premium-300 text-xs mt-1">Featured</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-premium-400 font-semibold p-2 text-sm">
                        {(() => {
                          const price = getPrice(product as any);
                          return `৳${new Intl.NumberFormat('en-US').format(price)}`;
                        })()}
                      </TableCell>
                      <TableCell className="p-2">
                        {product.inStock ? (
                          <span className="inline-flex items-center gap-1 text-green-400 font-semibold text-xs">✅ In Stock</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-xs">❌ Out of Stock</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge className={product.inStock ? 'bg-green-500/20 text-green-300 text-xs' : 'bg-red-500/20 text-red-300 text-xs'}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" className="border-premium-400 text-premium-400 hover:bg-premium-400/10 p-1 h-8 w-8">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-400 text-red-400 hover:bg-red-400/10 p-1 h-8 w-8"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="w-3 h-3" />
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

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <Card className="bg-gray-800/30 backdrop-blur-lg border border-premium-500/20">
            <CardHeader>
              <CardTitle className="text-white">Order Management ({orders.length} orders)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    id={`order-card-${order.id}`}
                    ref={(el) => {
                      orderCardRefs.current[order.id] = el;
                    }}
                    className={`bg-gray-700/30 border ${
                      highlightedOrderId === order.id
                        ? 'border-orange-500 ring-2 ring-orange-400/50'
                        : 'border-gray-600'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Order Info */}
                        <div>
                          <h4 className="text-lg font-semibold text-premium-400 mb-3">Order Details</h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-white"><strong>Order #:</strong> {order.orderNumber}</p>
                            <p className="text-gray-300"><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                            <p className="text-gray-300"><strong>Status:</strong> 
                              <Badge className={`ml-2 ${
                                order.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                                order.status === 'shipped' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {order.status}
                              </Badge>
                            </p>
                            <p className="text-gray-300"><strong>Payment:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : `bKash: ${order.bkashNumber}`}</p>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                          <h4 className="text-lg font-semibold text-green-400 mb-3">Customer Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-white">
                              <Users className="w-4 h-4 mr-2 text-gray-400" />
                              {order.customer.firstName} {order.customer.lastName}
                            </div>
                            <div className="flex items-center text-gray-300">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {order.customer.email}
                            </div>
                            <div className="flex items-center text-gray-300">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {order.customer.phone}
                            </div>
                            <div className="flex items-start text-gray-300">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                              <div>
                                <p>{order.customer.address}</p>
                                <p className="text-premium-400">{order.customer.deliveryArea}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Items & Pricing */}
                        <div>
                          <h4 className="text-lg font-semibold text-purple-400 mb-3">Items & Pricing</h4>
                          <div className="space-y-2 text-sm">
                            {order.items.map((item, index) => {
                              const price = getPrice(item);
                              
                              return (
                                <div key={index} className="flex justify-between text-gray-300">
                                  <span>{item.name} (x{item.quantity})</span>
                                  <span>৳{new Intl.NumberFormat('en-US').format(price * item.quantity)}</span>
                                </div>
                              );
                            })}
                            <div className="border-t border-gray-600 pt-2 mt-2">
                              <div className="flex justify-between text-gray-300">
                                <span>Subtotal:</span>
                                <span>৳{order.pricing?.subtotal || 0}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Delivery:</span>
                                <span>৳{order.pricing?.deliveryCharge || 0}</span>
                              </div>
                              <div className="flex justify-between text-white font-semibold text-lg">
                                <span>Total:</span>
                                <span>৳{order.pricing?.total || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-600">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-400 text-green-400 hover:bg-green-400/10"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          disabled={order.status === 'delivered'}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Delivered
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          disabled={order.status === 'delivered'}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Mark Shipped
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-400 text-red-400 hover:bg-red-400/10"
                          onClick={() => deleteOrder(order.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Product Tab */}
        {activeTab === 'add-product' && (
          <AddProduct />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
