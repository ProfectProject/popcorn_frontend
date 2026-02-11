'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ProductList from '../../../components/ProductList';
import AddProductModal from '../../../components/AddProductModal';
import ProductDetailModal from '../../../components/ProductDetailModal';
import './products.css';

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      name: '카라멜 팝콘',
      description: '달콤한 카라멜 팝콘',
      price: 3900,
      stock: 43,
      category: '단맛',
      image: '🍿',
      color: '#ea580c',
      status: 'active'
    },
    {
      id: 2,
      name: '치즈 팝콘',
      description: '고소한 치즈 팝콘',
      price: 4200,
      stock: 67,
      category: '짠맛',
      image: '🧀',
      color: '#f59e0b',
      status: 'active'
    },
    {
      id: 3,
      name: '초콜릿 팝콘',
      description: '진한 초콜릿 팝콘',
      price: 4500,
      stock: 12,
      category: '단맛',
      image: '🍫',
      color: '#8b5cf6',
      status: 'low_stock'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleAddProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: Date.now(),
      status: productData.stock > 20 ? 'active' : 'low_stock'
    };
    setProducts(prev => [...prev, newProduct]);
    setShowAddModal(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleUpdateProduct = (productData) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === editingProduct.id
          ? { ...productData, id: editingProduct.id, status: productData.stock > 20 ? 'active' : 'low_stock' }
          : p
      )
    );
    setEditingProduct(null);
    setShowAddModal(false);
  };

  const handleDeleteProduct = (productId) => {
    if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleLogout = () => {
    // 로컬스토리지 또는 세션 정리
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
    }
    router.push('/manager');
  };

  return (
    <div className="products-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="products-main">
        {/* 헤더 */}
        <header className="products-header">
          <div className="header-content">
            <h1 className="page-title">상품 관리</h1>
            <p className="page-subtitle">팝콘 메뉴 추가, 수정, 삭제 및 재고 관리</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowAddModal(true)}
              className="add-product-btn"
            >
              상품 추가
            </button>
          </div>
        </header>

        {/* 상품 목록 */}
        <section className="products-content">
          <ProductList
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onProductClick={handleProductClick}
          />
        </section>

        {/* 상품 추가/수정 모달 */}
        {showAddModal && (
          <AddProductModal
            product={editingProduct}
            onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
            onCancel={() => {
              setShowAddModal(false);
              setEditingProduct(null);
            }}
          />
        )}

        {/* 상품 상세정보 모달 */}
        {showDetailModal && selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onSave={(updatedProduct) => {
              setProducts(prev =>
                prev.map(p =>
                  p.id === updatedProduct.id ? updatedProduct : p
                )
              );
              setShowDetailModal(false);
              setSelectedProduct(null);
            }}
            onCancel={() => {
              setShowDetailModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </main>
    </div>
  );
}