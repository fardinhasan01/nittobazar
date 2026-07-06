import React, { useState } from 'react';
import { database } from '@/lib/firebase';
import { push, ref, set } from 'firebase/database';
import { Button } from '@/components/ui/button';

const products = [
  {
    name: 'T900 Ultra',
    price: 910,
    image: 'https://storola-client-space.sgp1.cdn.digitaloceanspaces.com/resources/clients/storola-clients/abshopbd.net/cache/catalog/FB_IMG_1711174765107-370x370.jpg',
  },
  {
    name: 'A9 Mini WiFi Camera 1080P Full HD Night Vision',
    price: 490,
    image: 'https://storola-client-space.sgp1.cdn.digitaloceanspaces.com/resources/clients/storola-clients/abshopbd.net/cache/catalog/images_92-370x370.jpeg',
  },
  {
    name: 'SX9 Mini Dual Microphone',
    price: 1670,
    image: 'https://storola-client-space.sgp1.cdn.digitaloceanspaces.com/resources/clients/storola-clients/abshopbd.net/cache/catalog/images_100-370x370.jpeg',
  },
  {
    name: 'Lenovo HE05X Sports Magnetic Wireless Neckband Earphones',
    price: 290,
    image: 'https://storola-client-space.sgp1.cdn.digitaloceanspaces.com/resources/clients/storola-clients/abshopbd.net/cache/catalog/products/Lenovo1-370x370.png',
  },
];

const UploadProducts = () => {
  const [status, setStatus] = useState('');

  const handleUpload = async () => {
    setStatus('Uploading...');
    try {
      for (const product of products) {
        const productRef = push(ref(database, 'products'));
        await set(productRef, { ...product, id: productRef.key });
      }
      setStatus('✅ All products uploaded successfully!');
    } catch (error) {
      setStatus('❌ Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4">Upload Products to Realtime Database</h2>
      <Button onClick={handleUpload} className="mb-4">Upload Products</Button>
      {status && <div className="mt-2 text-sm">{status}</div>}
    </div>
  );
};

export default UploadProducts; 
