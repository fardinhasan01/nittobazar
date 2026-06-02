import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useWishlist } from '@/context/WishlistContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Package, Heart, MapPin, Settings, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FadeInView from '@/components/FadeInView';

const Account = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { recent } = useRecentlyViewed();

  const savedOrders = (() => {
    try {
      return JSON.parse(localStorage.getItem('ab-orders') || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen bg-brand-gray dark:bg-brand-charcoal px-4 py-6 pb-28">
      <FadeInView>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-white mb-1">My Account</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage orders, wishlist & settings</p>
      </FadeInView>

      <Tabs defaultValue="orders" className="max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 rounded-2xl bg-white dark:bg-brand-charcoal shadow-sm">
          <TabsTrigger value="orders" className="rounded-xl text-xs sm:text-sm py-2.5">
            <Package className="w-4 h-4 sm:mr-1 shrink-0" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="rounded-xl text-xs sm:text-sm py-2.5">
            <Heart className="w-4 h-4 sm:mr-1 shrink-0" />
            <span className="hidden sm:inline">Wishlist</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-xl text-xs sm:text-sm py-2.5">
            <MapPin className="w-4 h-4 sm:mr-1 shrink-0" />
            <span className="hidden sm:inline">Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl text-xs sm:text-sm py-2.5">
            <Settings className="w-4 h-4 sm:mr-1 shrink-0" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-3">
          {savedOrders.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-brand-orange mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">No orders yet</p>
                <Link to="/shop">
                  <Button className="bg-brand-orange hover:bg-[#e55f00] rounded-xl">Shop Now</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            savedOrders.map((order: { id: string; date: string; total: number }, i: number) => (
              <Card key={i} className="glass-card border-0">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">Order #{order.id?.slice?.(0, 8) || i + 1}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <span className="font-bold text-brand-orange">৳{order.total}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-4 space-y-3">
          {wishlist.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="p-8 text-center">
                <Heart className="w-10 h-10 text-brand-orange mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Your wishlist is empty</p>
              </CardContent>
            </Card>
          ) : (
            wishlist.map((item) => (
              <Card key={item.id} className="glass-card border-0">
                <CardContent className="p-3 flex items-center gap-3">
                  <img
                    src={item.mainImageUrl || '/placeholder.jpg'}
                    alt={item.name}
                    className="w-14 h-14 object-contain rounded-xl bg-brand-gray"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                    <p className="text-brand-orange font-bold text-sm">
                      ৳{(item.offerPrice && item.offerPrice < (item.price || 0)
                        ? item.offerPrice
                        : item.price || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWishlist(item)}
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          <Card className="glass-card border-0">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <MapPin className="w-8 h-8 text-brand-orange mx-auto mb-2" />
              Save addresses at checkout for faster orders next time.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-3">
          <Card className="glass-card border-0">
            <CardContent className="p-4 space-y-3 text-sm">
              <p className="font-semibold">Contact Support</p>
              <p className="text-muted-foreground">Phone: 01706003435</p>
              <p className="text-muted-foreground">Email: saifuldipu8@gmail.com</p>
              {recent.length > 0 && (
                <p className="text-muted-foreground pt-2 border-t">
                  {recent.length} recently viewed products saved locally
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
