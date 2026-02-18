'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ProductList from '../../../components/ProductList';
import AddProductModal from '../../../components/AddProductModal';
import ProductDetailModal from '../../../components/ProductDetailModal';
import './products.css';
import {
  clearManagerSession,
  createGoods,
  deleteGoods,
  getManagerToken,
  getManagerUser,
  getSelectedPopupId,
  getSelectedStoreId,
  listGoods,
  listPopups,
  listStores,
  mapGoodsToUi,
  setSelectedPopupId,
  setSelectedStoreId,
  updateGoods
} from '../../../lib/managerApi';

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '박매니저',
    email: 'manager@popcorn.kr'
  });
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreIdState] = useState('');
  const [popups, setPopups] = useState([]);
  const [selectedPopupId, setSelectedPopupIdState] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const token = getManagerToken();
    if (!token) {
      router.replace('/manager');
      return;
    }

    const savedUser = getManagerUser();
    if (savedUser) {
      setUser({
        name: savedUser.name || savedUser.email || '매니저',
        email: savedUser.email || 'manager@popcorn.kr'
      });
    }

    const loadBaseData = async () => {
      setError('');
      setIsLoading(true);

      try {
        const storeList = await listStores();
        setStores(storeList);

        if (!storeList.length) {
          setSelectedStoreIdState('');
          setPopups([]);
          setSelectedPopupIdState('');
          setProducts([]);
          return;
        }

        const savedStoreId = getSelectedStoreId();
        const hasSavedStore = savedStoreId && storeList.some((store) => store.id === savedStoreId);
        const initialStoreId = hasSavedStore ? savedStoreId : storeList[0].id;

        setSelectedStoreId(initialStoreId);
        setSelectedStoreIdState(initialStoreId);
      } catch (loadError) {
        setError(loadError?.message || '스토어 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBaseData();
  }, [router]);

  useEffect(() => {
    if (!selectedStoreId) return;

    const loadPopupsByStore = async () => {
      setError('');
      setIsLoading(true);

      try {
        const popupList = await listPopups(selectedStoreId, { page: 1, size: 100 });
        setPopups(popupList);

        if (!popupList.length) {
          setSelectedPopupIdState('');
          setSelectedPopupId('');
          setProducts([]);
          return;
        }

        const savedPopupId = getSelectedPopupId();
        const hasSavedPopup = savedPopupId && popupList.some((popup) => popup.popupId === savedPopupId);
        const initialPopupId = hasSavedPopup ? savedPopupId : popupList[0].popupId;

        setSelectedPopupIdState(initialPopupId);
        setSelectedPopupId(initialPopupId);
      } catch (loadError) {
        setError(loadError?.message || '팝업 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPopupsByStore();
  }, [selectedStoreId]);

  useEffect(() => {
    if (!selectedPopupId) return;

    const loadGoods = async () => {
      setError('');
      setIsLoading(true);

      try {
        const response = await listGoods(selectedPopupId);
        const items = response?.items || [];
        setProducts((prev) => {
          const prevById = new Map(prev.map((item) => [item.id, item]));
          return items.map((item) => mapGoodsToUi(item, prevById.get(item.id)));
        });
      } catch (loadError) {
        setError(loadError?.message || '상품 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadGoods();
  }, [selectedPopupId]);

  const handleAddProduct = async (productData) => {
    if (!selectedPopupId) {
      setError('팝업을 먼저 선택해주세요.');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const created = await createGoods(selectedPopupId, productData);
      const newProduct = {
        ...productData,
        id: created.id,
        status: productData.stock > 20 ? 'active' : 'low_stock'
      };
      setProducts(prev => [...prev, newProduct]);
      setShowAddModal(false);
    } catch (saveError) {
      setError(saveError?.message || '상품 추가에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleUpdateProduct = async (productData) => {
    if (!selectedPopupId || !editingProduct) return;

    setError('');
    setIsSaving(true);

    try {
      await updateGoods(selectedPopupId, editingProduct.id, productData);
      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? {
              ...p,
              ...productData,
              id: editingProduct.id,
              status: productData.stock > 20 ? 'active' : 'low_stock'
            }
            : p
        )
      );
      setEditingProduct(null);
      setShowAddModal(false);
    } catch (saveError) {
      setError(saveError?.message || '상품 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!selectedPopupId) return;

    if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      setError('');
      try {
        await deleteGoods(selectedPopupId, productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (deleteError) {
        setError(deleteError?.message || '상품 삭제에 실패했습니다.');
      }
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleLogout = () => {
    clearManagerSession();
    router.push('/manager');
  };

  const handleStoreChange = (e) => {
    const nextStoreId = e.target.value;
    setSelectedStoreId(nextStoreId);
    setSelectedStoreIdState(nextStoreId);
  };

  const handlePopupChange = (e) => {
    const nextPopupId = e.target.value;
    setSelectedPopupId(nextPopupId);
    setSelectedPopupIdState(nextPopupId);
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
            {stores.length > 0 && (
              <div className="status-filter">
                <select value={selectedStoreId} onChange={handleStoreChange} className="filter-btn">
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select value={selectedPopupId} onChange={handlePopupChange} className="filter-btn">
                  {popups.map((popup) => (
                    <option key={popup.popupId} value={popup.popupId}>
                      {popup.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowAddModal(true)}
              className="add-product-btn"
              disabled={!selectedPopupId || isSaving}
            >
              상품 추가
            </button>
          </div>
        </header>

        {error && <div className="error-alert">{error}</div>}
        {isLoading && <div className="loading">상품 정보를 불러오는 중...</div>}
        {!isLoading && !error && stores.length === 0 && (
          <div className="loading">등록된 스토어가 없습니다. 스토어를 먼저 생성해주세요.</div>
        )}
        {!isLoading && stores.length > 0 && !selectedPopupId && (
          <div className="loading">등록된 팝업이 없습니다. 팝업을 먼저 생성해주세요.</div>
        )}

        {/* 상품 목록 */}
        {!isLoading && selectedPopupId && (
          <section className="products-content">
            <ProductList
              products={products}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onProductClick={handleProductClick}
            />
          </section>
        )}

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
            onSave={async (updatedProduct) => {
              if (!selectedPopupId) return;
              setError('');
              setIsSaving(true);
              try {
                await updateGoods(selectedPopupId, updatedProduct.id, updatedProduct);
                setProducts(prev =>
                  prev.map(p =>
                    p.id === updatedProduct.id
                      ? {
                        ...p,
                        ...updatedProduct,
                        status: updatedProduct.stock > 20 ? 'active' : 'low_stock'
                      }
                      : p
                  )
                );
                setShowDetailModal(false);
                setSelectedProduct(null);
              } catch (saveError) {
                setError(saveError?.message || '상품 수정에 실패했습니다.');
              } finally {
                setIsSaving(false);
              }
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
