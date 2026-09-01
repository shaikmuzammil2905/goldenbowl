import { useState, useEffect } from 'react';
import { productApi } from '../services/api/productApi';

export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const category = params.category;
  const search = params.search;
  const vegOnly = params.vegOnly;

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productApi.getProducts({ category, search, vegOnly });
        if (active) setProducts(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load products');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, [category, search, vegOnly]);

  const toggleAvailability = async (id) => {
    try {
      const updated = await productApi.toggleProductAvailability(id);
      setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
    } catch (err) {
      setError(err.message);
    }
  };

  return { products, loading, error, toggleAvailability };
}
