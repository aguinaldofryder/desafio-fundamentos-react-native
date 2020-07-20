import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const PRODUCTS_STORAGE_KEY = '@GoMarketplace:products';
const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (productsStorage) setProducts(JSON.parse(productsStorage));
    }

    loadProducts();
  }, []);

  const saveProductsInStorage = useCallback(async (data: Product[]) => {
    await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addToCart = useCallback(
    async product => {
      const productAdded = products.find(item => item.id === product.id);

      if (productAdded) {
        const productsIncremented = products.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
        setProducts(productsIncremented);
        await saveProductsInStorage(productsIncremented);
        return;
      }
      const productsIncremented = [...products, { ...product, quantity: 1 }];
      setProducts(productsIncremented);
      await saveProductsInStorage(productsIncremented);
    },
    [products, saveProductsInStorage],
  );

  const increment = useCallback(
    async id => {
      const productsIncremented = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(productsIncremented);
      await saveProductsInStorage(productsIncremented);
    },
    [products, saveProductsInStorage],
  );

  const decrement = useCallback(
    async id => {
      const productsDecremented = products
        .map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        )
        .filter(product => product.quantity > 0);
      setProducts(productsDecremented);
      await saveProductsInStorage(productsDecremented);
    },
    [products, saveProductsInStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
