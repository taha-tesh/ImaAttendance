'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchJson } from '@/lib/api';
import type { Employee, AttendanceRow } from '@/lib/types';
import {
  currentTimeStr,
  todayISO,
  formatDDMMYYYY,
  arabicDayName,
  minutesToHuman,
  totalDelay,
} from '@/lib/attendance';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';

type Field = 'entry1' | 'exit1' | 'entry2' | 'exit2';

export default function Kiosk() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [todayRow, setTodayRow] = useState<AttendanceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await fetchJson<Employee[]>('/api/employees');
      setEmployees(data);
    } catch {
      setEmployees([]);
    }
  }, []);

  const loadToday = useCallback(async (empId: string) => {
    try {
      const data = await fetchJson<AttendanceRow | null>(
        `/api/attendance?employee_id=${encodeURIComponent(empId)}&date=${todayISO()}`
      );
      setTodayRow(data);
    } catch {
      setTodayRow(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadEmployees();
      setLoading(false);
    })();
  }, [loadEmployees]);

  useEffect(() => {
    if (selectedId) {
      loadToday(selectedId);
    } else {
      setTodayRow(null);
    }
  }, [selectedId, loadToday]);

  const flash = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const stamp = async (field: Field, label: string) => {
    if (!selectedId) return;
    setBusy(true);
    const time = currentTimeStr();
    const date = todayISO();

    try {
      const data = await fetchJson<AttendanceRow>('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: selectedId,
          work_date: date,
          [field]: time,
        }),
      });
      setTodayRow(data);
      flash(`تم تسجيل ${label} بنجاح`, true);
    } catch {
      flash('حدث خطأ أثناء التسجيل. حاول مرة أخرى.', false);
    }
    setBusy(false);
  };

  const selectedEmp = employees.find((e) => e.id === selectedId);
  const delay = todayRow ? totalDelay(todayRow) : 0;

  const actions: {
    field: Field;
    label: string;
    icon: React.ReactNode;
    done: boolean;
    color: string;
  }[] = [
    {
      field: 'entry1',
      label: 'تسجيل الدخول - الصباح',
      icon: <LogIn className="h-6 w-6" />,
      done: !!todayRow?.entry1,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    {
      field: 'exit1',
      label: 'خروج للاستراحة',
      icon: <Coffee className="h-6 w-6" />,
      done: !!todayRow?.exit1,
      color: 'bg-warning text-warning-foreground hover:bg-warning/90',
    },
    {
      field: 'entry2',
      label: 'عودة من الاستراحة',
      icon: <Utensils className="h-6 w-6" />,
      done: !!todayRow?.entry2,
      color: 'bg-success text-success-foreground hover:bg-success/90',
    },
    {
      field: 'exit2',
      label: 'تسجيل الخروج - المساء',
      icon: <LogOut className="h-6 w-6" />,
      done: !!todayRow?.exit2,
      color: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">جارٍ التحميل…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Live clock */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {arabicDayName(todayISO())} - {formatDDMMYYYY(todayISO())}
          </span>
        </div>
        <div className="text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-6xl">
          {now.toLocaleTimeString('en-GB', { hour12: false })}
        </div>
      </div>

      {/* Employee selector */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-foreground">
          اختر اسم المتعاون
        </label>
        {employees.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            لا يوجد موظفون مسجّلون بعد. تواصل مع الإدارة لإضافة موظف.
          </div>
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="— اختر الموظف —" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id} className="text-base">
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Action buttons */}
      {selectedId && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actions.map((a) => (
            <button
              key={a.field}
              onClick={() => stamp(a.field, a.label)}
              disabled={busy || a.done}
              className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${a.color}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                {a.done ? <CheckCircle2 className="h-7 w-7" /> : a.icon}
              </div>
              <div>
                <div className="text-base font-bold">{a.label}</div>
                {a.done && (
                  <div className="mt-1 text-xs opacity-90">
                    تم التسجيل: {todayRow?.[a.field]}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Today summary */}
      {selectedId && todayRow && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-foreground">
            سجل اليوم - {selectedEmp?.full_name}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TimeChip label="دخول ١" value={todayRow.entry1} />
            <TimeChip label="خروج ١" value={todayRow.exit1} />
            <TimeChip label="دخول ٢" value={todayRow.entry2} />
            <TimeChip label="خروج ٢" value={todayRow.exit2} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              التأخير اليوم
            </span>
            <span
              className={`text-base font-bold ${
                delay > 0 ? 'text-destructive' : 'text-success'
              }`}
            >
              {minutesToHuman(delay)}
            </span>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-1/2 z-50 translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.ok ? 'bg-success' : 'bg-destructive'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function TimeChip({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-bold tabular-nums text-foreground">
        {value ?? '—'}
      </div>
    </div>
  );
}
