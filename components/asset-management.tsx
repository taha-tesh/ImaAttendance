'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchJson } from '@/lib/api';
import type { AssetItem, AssetSummary, AssetType, AssetFund } from '@/lib/types';
import { Pencil, Plus, DollarSign, Trash2 } from 'lucide-react';

export default function AssetManagement() {
  const [types, setTypes] = useState<AssetType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [items, setItems] = useState<AssetItem[]>([]);
  const [funds, setFunds] = useState<AssetFund[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeName, setTypeName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  const [itemQuantityInStock, setItemQuantityInStock] = useState('');
  const [editingItemId, setEditingItemId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [error, setError] = useState('');

  const loadTypes = useCallback(async () => {
    try {
      const data = await fetchJson<AssetType[]>('/api/asset-types');
      setTypes(data);
      if (!selectedTypeId && data.length > 0) {
        setSelectedTypeId(data[0].id);
      }
    } catch {
      setTypes([]);
    }
  }, [selectedTypeId]);

  const loadSummary = useCallback(async (typeId: string) => {
    if (!typeId) {
      setItems([]);
      setFunds([]);
      setSummary(null);
      return;
    }
    try {
      const data = await fetchJson<AssetSummary>(`/api/asset-summary?type_id=${encodeURIComponent(typeId)}`);
      setItems(data.items);
      setFunds(data.funds);
      setSummary(data);
    } catch {
      setItems([]);
      setFunds([]);
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadTypes();
      setLoading(false);
    })();
  }, [loadTypes]);

  useEffect(() => {
    if (selectedTypeId) {
      loadSummary(selectedTypeId);
    }
  }, [selectedTypeId, loadSummary]);

  const addType = async () => {
    if (!typeName.trim()) {
      setError('أدخل اسم نوع المورد');
      return;
    }
    setError('');
    try {
      await fetchJson('/api/asset-types', {
        method: 'POST',
        body: JSON.stringify({ name: typeName.trim() }),
      });
      setTypeName('');
      await loadTypes();
    } catch {
      setError('فشل إنشاء النوع. حاول مرة أخرى.');
    }
  };

  const resetItemForm = () => {
    setItemName('');
    setItemQuantity('');
    setItemQuantityInStock('');
    setItemUnitPrice('');
    setEditingItemId('');
  };

  const saveItem = async () => {
    if (
      !selectedTypeId ||
      !itemName.trim() ||
      Number(itemQuantity) <= 0 ||
      Number(itemQuantityInStock) < 0 ||
      Number(itemUnitPrice) < 0
    ) {
      setError('أكمل بيانات المنتج بشكل صحيح');
      return;
    }
    setError('');

    try {
      const payload = {
        type_id: selectedTypeId,
        name: itemName.trim(),
        quantity: Number(itemQuantity),
        quantity_in_stock: Number(itemQuantityInStock),
        unit_price: Number(itemUnitPrice),
      };

      if (editingItemId) {
        await fetchJson(`/api/asset-items?id=${encodeURIComponent(editingItemId)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson('/api/asset-items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      resetItemForm();
      await loadSummary(selectedTypeId);
    } catch {
      setError(editingItemId ? 'فشل تحديث المنتج. حاول مرة أخرى.' : 'فشل إضافة المنتج. حاول مرة أخرى.');
    }
  };

  const editItem = (item: AssetItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemQuantity(String(item.quantity));
    setItemQuantityInStock(String(item.quantity_in_stock ?? 0));
    setItemUnitPrice(String(item.unit_price));
    setError('');
  };

  const cancelEdit = () => {
    resetItemForm();
    setError('');
  };

  const deleteItem = async (itemId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      return;
    }
    setError('');
    try {
      await fetchJson(`/api/asset-items?id=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      if (selectedTypeId) {
        await loadSummary(selectedTypeId);
      }
    } catch {
      setError('فشل حذف المنتج. حاول مرة أخرى.');
    }
  };

  const addFund = async () => {
    if (!selectedTypeId || Number(fundAmount) <= 0) {
      setError('أدخل مبلغاً صالحاً');
      return;
    }
    setError('');
    try {
      await fetchJson('/api/asset-funds', {
        method: 'POST',
        body: JSON.stringify({ type_id: selectedTypeId, amount: Number(fundAmount) }),
      });
      setFundAmount('');
      await loadSummary(selectedTypeId);
    } catch {
      setError('فشل إضافة المال. حاول مرة أخرى.');
    }
  };

  const totalItems = useMemo(() => summary?.total_item_price ?? '0.00', [summary]);
  const totalFunds = useMemo(() => summary?.total_funds ?? '0.00', [summary]);
  const balance = useMemo(() => summary?.balance ?? '0.00', [summary]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">إدارة المشتريات</h2>
              <p className="text-sm text-muted-foreground">اختر نوع المورد أو أضف جديداً</p>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              نوع المورد
            </Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوعاً" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                    {type.available_amount != null ? ` — ${Number(type.available_amount).toFixed(2)} د.ج` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              إضافة نوع جديد
            </Label>
            <div className="space-y-2">
              <Input
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="اسم النوع"
              />
              <Button className="w-full" onClick={addType}>
                <Plus className="ml-2 h-4 w-4" /> إضافة نوع
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-muted/50 p-4">
            <div className="text-sm font-semibold text-foreground">المجموع</div>
            <div className="mt-3 space-y-2 text-sm text-foreground">
              <div className="flex justify-between">
                <span>إجمالي سعر المنتجات</span>
                <span>{totalItems} د.ج</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المبالغ المضافة</span>
                <span>{totalFunds} د.ج</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>الرصيد</span>
                <span className={Number(balance) >= 0 ? 'text-success' : 'text-destructive'}>
                  {balance} د.ج
                </span>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-foreground">إضافة منتج</h3>
              <p className="text-sm text-muted-foreground">أدخل بيانات المنتج وتأكد من الكمية في المخزون</p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>اسم المنتج</Label>
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="اسم المنتج" />
              </div>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  placeholder="الكمية"
                />
              </div>
              <div className="space-y-2">
                <Label>الكمية في المخزون</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemQuantityInStock}
                  onChange={(e) => setItemQuantityInStock(e.target.value)}
                  placeholder="الكمية في المخزون"
                />
              </div>
              <div className="space-y-2">
                <Label>سعر الوحدة</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value)}
                  placeholder="سعر الوحدة"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={saveItem}>
                <Plus className="ml-2 h-4 w-4" /> {editingItemId ? 'تحديث المنتج' : 'إضافة منتج'}
              </Button>
              {editingItemId && (
                <Button variant="outline" onClick={cancelEdit}>
                  إلغاء
                </Button>
              )}
            </div>
            {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">سجلات الأصناف</h3>
                <p className="text-sm text-muted-foreground">عرض المنتجات حسب النوع المحدد</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">الاسم</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">الكمية</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">كمية في المخزون</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">الكمية المتاحة</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">سعر الوحدة</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">السعر الكلي</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">الإجراءات</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">وقت الإضافة</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 hover:bg-muted/10">
                      <td className="px-3 py-2 text-right">{item.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity_in_stock}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.available_quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{Number(item.total_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => editItem(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                        لا توجد منتجات لهذا النوع.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-foreground">سجل المال</h3>
                <p className="text-sm text-muted-foreground">أضف مبلغاً جديداً أو راجع السجل</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="المبلغ المُضاف"
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={addFund}>
                  <DollarSign className="ml-2 h-4 w-4" /> إضافة مال
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">المبلغ</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">التاريخ والوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map((fund) => (
                      <tr key={fund.id} className="border-b border-border/60 hover:bg-muted/10">
                        <td className="px-3 py-2 text-right tabular-nums">{Number(fund.amount).toFixed(2)} د.ج</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{new Date(fund.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {funds.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">
                          لا توجد سجلات أموال لهذا النوع.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </section>
      </div>
    </div>
  );
}
