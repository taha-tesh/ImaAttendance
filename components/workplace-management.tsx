'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchJson } from '@/lib/api';
import type { Workplace } from '@/lib/types';
import { minutesToHuman, clockToMinutes } from '@/lib/attendance';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';

function computeTotalMinutes(start: string, end: string, breakMinutes: number): number | null {
  if (!start || !end) return null;
  const span = clockToMinutes(end) - clockToMinutes(start);
  if (span <= 0) return null;
  const total = span - breakMinutes;
  return total > 0 ? total : null;
}

export default function WorkplaceManagement() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('16:30');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadWorkplaces = useCallback(async () => {
    try {
      const data = await fetchJson<Workplace[]>('/api/workplaces');
      setWorkplaces(data);
    } catch {
      setWorkplaces([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadWorkplaces();
      setLoading(false);
    })();
  }, [loadWorkplaces]);

  const breakValue = Number(breakMinutes);
  const calculatedTotal = useMemo(
    () =>
      computeTotalMinutes(
        startTime,
        endTime,
        Number.isFinite(breakValue) && breakValue >= 0 ? breakValue : 0
      ),
    [startTime, endTime, breakValue]
  );

  const resetForm = () => {
    setName('');
    setStartTime('07:30');
    setEndTime('16:30');
    setBreakMinutes('60');
    setEditingId('');
    setError('');
  };

  const saveWorkplace = async () => {
    if (!name.trim()) {
      setError('أدخل اسم مكان العمل');
      return;
    }
    if (!Number.isFinite(breakValue) || breakValue < 0) {
      setError('أدخل مدة استراحة صحيحة');
      return;
    }
    if (calculatedTotal === null) {
      setError('وقت النهاية يجب أن يكون بعد البداية وإجمالي العمل يجب أن يكون أكبر من صفر');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      name: name.trim(),
      start_time: startTime,
      end_time: endTime,
      break_minutes: breakValue,
    };

    try {
      if (editingId) {
        await fetchJson(`/api/workplaces?id=${encodeURIComponent(editingId)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson('/api/workplaces', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadWorkplaces();
    } catch {
      setError(editingId ? 'فشل تحديث مكان العمل.' : 'فشل إضافة مكان العمل.');
    } finally {
      setSaving(false);
    }
  };

  const editWorkplace = (wp: Workplace) => {
    setEditingId(wp.id);
    setName(wp.name);
    setStartTime(wp.start_time.slice(0, 5));
    setEndTime(wp.end_time.slice(0, 5));
    setBreakMinutes(String(wp.break_minutes));
    setError('');
  };

  const deleteWorkplace = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف مكان العمل؟')) return;
    setError('');
    try {
      const response = await fetch(`/api/workplaces?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      if (editingId === id) resetForm();
      await loadWorkplaces();
    } catch {
      setError('فشل حذف مكان العمل.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">إدارة أماكن العمل</h2>
          <p className="text-xs text-muted-foreground">
            أضف مكان العمل مع أوقات الدوام؛ يُحسب إجمالي ساعات العمل تلقائياً
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">
            {editingId ? 'تعديل مكان العمل' : 'إضافة مكان عمل'}
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wp-name">اسم مكان العمل</Label>
              <Input
                id="wp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: المقر الرئيسي"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="wp-start">وقت البداية</Label>
                <Input
                  id="wp-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-end">وقت النهاية</Label>
                <Input
                  id="wp-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp-break">مدة الاستراحة (دقيقة)</Label>
              <Input
                id="wp-break"
                type="number"
                min={0}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
              />
            </div>

            <div
              className={`rounded-xl border px-3 py-3 text-sm ${
                calculatedTotal === null
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-primary/20 bg-primary/5 text-foreground'
              }`}
            >
              <div className="text-xs text-muted-foreground">إجمالي وقت العمل في اليوم</div>
              <div className="mt-1 text-lg font-bold">
                {calculatedTotal === null ? '—' : minutesToHuman(calculatedTotal)}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={saveWorkplace} disabled={saving} className="flex-1">
                <Plus className="ml-2 h-4 w-4" />
                {saving ? 'جارٍ الحفظ…' : editingId ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-foreground">
            أماكن العمل ({workplaces.length})
          </h3>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">جارٍ التحميل…</div>
          ) : workplaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              لا توجد أماكن عمل بعد. أضف مكاناً من النموذج الجانبي.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">
                      الاسم
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">
                      البداية
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">
                      النهاية
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">
                      الاستراحة
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">
                      إجمالي اليوم
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">
                      الإجراء
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workplaces.map((wp) => (
                    <tr key={wp.id} className="border-b border-border/60 hover:bg-muted/10">
                      <td className="px-3 py-2.5 font-medium">{wp.name}</td>
                      <td className="px-3 py-2.5 tabular-nums">{wp.start_time}</td>
                      <td className="px-3 py-2.5 tabular-nums">{wp.end_time}</td>
                      <td className="px-3 py-2.5 tabular-nums">{wp.break_minutes} د</td>
                      <td className="px-3 py-2.5 font-medium text-primary">
                        {minutesToHuman(wp.total_minutes)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editWorkplace(wp)}
                            className="rounded-lg border border-border bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteWorkplace(wp.id)}
                            className="rounded-lg border border-border bg-muted px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
