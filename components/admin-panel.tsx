'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchJson } from '@/lib/api';
import type { Employee, AttendanceRow } from '@/lib/types';
import {
  arabicDayName,
  arabicMonthYear,
  daysInMonth,
  formatDDMMYYYY,
  isoForDay,
  minutesToHuman,
  totalDelay,
  todayISO,
} from '@/lib/attendance';
import { ARABIC_MONTHS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  UserPlus,
  Trash2,
  LogOut,
  Printer,
  CalendarDays,
  Users,
  Clock,
  FileSpreadsheet,
  Pencil,
} from 'lucide-react';

export default function AdminPanel() {
  const { signOut } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [delEmp, setDelEmp] = useState<Employee | null>(null);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(todayISO());
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addRowOpen, setAddRowOpen] = useState(false);
  const [rowDate, setRowDate] = useState(todayISO());
  const [rowEntry1, setRowEntry1] = useState('');
  const [rowExit1, setRowExit1] = useState('');
  const [rowEntry2, setRowEntry2] = useState('');
  const [rowExit2, setRowExit2] = useState('');
  const [addingRow, setAddingRow] = useState(false);
  const [addRowErr, setAddRowErr] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);
  const [editEntry1, setEditEntry1] = useState('');
  const [editExit1, setEditExit1] = useState('');
  const [editEntry2, setEditEntry2] = useState('');
  const [editExit2, setEditExit2] = useState('');
  const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [deleteRow, setDeleteRow] = useState<AttendanceRow | null>(null);
  const [deletingRow, setDeletingRow] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const loadEmployees = useCallback(async () => {
    try {
      const data = await fetchJson<Employee[]>('/api/employees');
      setEmployees(data);
    } catch {
      setEmployees([]);
    }
  }, []);

  const loadRows = useCallback(async (empId: string, y: number, m: number) => {
    const start = isoForDay(y, m, 1);
    const end = isoForDay(y, m, daysInMonth(y, m));
    try {
      const data = await fetchJson<AttendanceRow[]>(
        `/api/attendance?employee_id=${encodeURIComponent(empId)}&start_date=${start}&end_date=${end}`
      );
      setRows(data);
    } catch {
      setRows([]);
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
    if (!selectedEmpId && employees.length > 0) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  useEffect(() => {
    if (selectedEmpId) {
      loadRows(selectedEmpId, year, month);
    } else {
      setRows([]);
    }
  }, [selectedEmpId, year, month, loadRows]);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);

  const openEditRow = (row: AttendanceRow) => {
    setEditingRow(row);
    setEditEntry1(row.entry1 ?? '');
    setEditExit1(row.exit1 ?? '');
    setEditEntry2(row.entry2 ?? '');
    setEditExit2(row.exit2 ?? '');
    setEditErr(null);
  };

  const saveEditRow = async () => {
    if (!editingRow) return;
    setEditing(true);
    setEditErr(null);

    try {
      await fetchJson<AttendanceRow>(`/api/attendance/${editingRow.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          entry1: editEntry1 || null,
          exit1: editExit1 || null,
          entry2: editEntry2 || null,
          exit2: editExit2 || null,
        }),
      });
      setEditingRow(null);
      await loadRows(selectedEmpId, year, month);
    } catch {
      setEditErr('حدث خطأ أثناء التحديث. حاول مرة أخرى.');
    } finally {
      setEditing(false);
    }
  };

  const confirmDeleteRow = (row: AttendanceRow) => {
    setDeleteRow(row);
  };

  const deleteAttendanceRow = async () => {
    if (!deleteRow) return;
    setDeletingRow(true);
    try {
      const response = await fetch(`/api/attendance/${deleteRow.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      setDeleteRow(null);
      await loadRows(selectedEmpId, year, month);
    } catch {
      // ignore for now
    } finally {
      setDeletingRow(false);
    }
  };

  // Build full month grid
  const monthGrid = useMemo(() => {
    const dim = daysInMonth(year, month);
    const byDate = new Map<string, AttendanceRow>();
    rows.forEach((r) => byDate.set(r.work_date, r));
    return Array.from({ length: dim }, (_, i) => {
      const day = i + 1;
      const iso = isoForDay(year, month, day);
      return {
        iso,
        day,
        dayName: arabicDayName(iso),
        row: byDate.get(iso) ?? null,
      };
    });
  }, [rows, year, month]);

  // Stats
  const stats = useMemo(() => {
    const worked = rows.filter((r) => r.entry1).length;
    const totalDelayMin = rows.reduce((sum, r) => sum + totalDelay(r), 0);
    return { worked, totalDelayMin };
  }, [rows]);

  const handleAdd = async () => {
    setAddErr(null);
    if (!newName.trim()) {
      setAddErr('الرجاء إدخال اسم الموظف');
      return;
    }
    setAdding(true);
    try {
      await fetchJson('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          full_name: newName.trim(),
          starting_date: newDate,
        }),
      });
      setNewName('');
      setNewDate(todayISO());
      setAddOpen(false);
      await loadEmployees();
    } catch {
      setAddErr('حدث خطأ أثناء الإضافة. حاول مرة أخرى.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEmp = async () => {
    if (!delEmp) return;
    try {
      const response = await fetch(`/api/employees/${delEmp.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      if (selectedEmpId === delEmp.id) setSelectedEmpId('');
      setDelEmp(null);
      await loadEmployees();
    } catch {
      // Keep the dialog open so user can retry or cancel.
    }
  };

  const exportCSV = () => {
    const header = [
      'اليوم',
      'التاريخ',
      'وقت الدخول 1',
      'وقت الخروج 1',
      'وقت الدخول 2',
      'وقت الخروج 2',
      'التأخير',
    ];
    const lines = monthGrid.map((g) => {
      const r = g.row;
      const delay = r ? totalDelay(r) : 0;
      return [
        g.dayName,
        formatDDMMYYYY(g.iso),
        r?.entry1 ?? '',
        r?.exit1 ?? '',
        r?.entry2 ?? '',
        r?.exit2 ?? '',
        minutesToHuman(delay),
      ].join(',');
    });
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedEmp?.full_name ?? 'employee'}-${year}-${month + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const yearOptions = useMemo(() => {
    const ys: number[] = [];
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) ys.push(y);
    return ys;
  }, [now]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Toolbar */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">لوحة الإدارة</h2>
            <p className="text-xs text-muted-foreground">
              مرحباً بك في لوحة الإدارة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} size="sm">
            <UserPlus className="ml-2 h-4 w-4" />
            إضافة موظف
          </Button>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="ml-2 h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="no-print mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-3">
        {/* Employee */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" /> الموظف
          </Label>
          <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
            <SelectTrigger>
              <SelectValue placeholder="— اختر الموظف —" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Month */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="h-3.5 w-3.5" /> الشهر
          </Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARABIC_MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Year */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="h-3.5 w-3.5" /> السنة
          </Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          جارٍ التحميل…
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          لا يوجد موظفون. اضغط &quot;إضافة موظف&quot; لبدء التسجيل.
        </div>
      ) : !selectedEmpId ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          اختر موظفاً لعرض سجل الحضور الشهري.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="no-print mb-6 grid gap-4 sm:grid-cols-2">
            <StatBox
              icon={<CalendarDays className="h-6 w-6" />}
              label="إجمالي أيام العمل في الشهر"
              value={`${stats.worked} يوم`}
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatBox
              icon={<Clock className="h-6 w-6" />}
              label="إجمالي التأخير في الشهر"
              value={minutesToHuman(stats.totalDelayMin)}
              color={stats.totalDelayMin > 0 ? 'text-destructive' : 'text-success'}
              bg={stats.totalDelayMin > 0 ? 'bg-destructive/10' : 'bg-success/10'}
            />
          </div>

          {/* Action bar */}
          <div className="no-print mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              سجل الحضور - {arabicMonthYear(year, month)}
            </h3>
            <div className="flex gap-2">
                <Button onClick={exportCSV} variant="outline" size="sm">
                <FileSpreadsheet className="ml-2 h-4 w-4" />
                تصدير CSV
              </Button>
                <Button onClick={() => setAddRowOpen(true)} variant="outline" size="sm">
                  <Clock className="ml-2 h-4 w-4" />
                  إضافة سجل
                </Button>
              <Button onClick={() => window.print()} size="sm">
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>
            </div>
          </div>

          {/* Employee management list */}
          <div className="no-print mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">
                إدارة الموظفين ({employees.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {employees.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedEmpId === e.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background'
                  }`}
                >
                  <button
                    onClick={() => setSelectedEmpId(e.id)}
                    className="font-medium"
                  >
                    {e.full_name}
                  </button>
                  <button
                    onClick={() => setDelEmp(e)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    title="حذف الموظف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance sheet (printable) */}
          <AttendanceSheet
            empName={selectedEmp?.full_name ?? ''}
            monthLabel={arabicMonthYear(year, month)}
            grid={monthGrid}
            onEditRow={openEditRow}
            onDeleteRow={confirmDeleteRow}
          />
        </>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">الاسم الكامل</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم المتعاون"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-date">تاريخ بدء العمل</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            {addErr && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {addErr}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? 'جارٍ الإضافة…' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Add attendance record dialog */}
        <Dialog open={addRowOpen} onOpenChange={setAddRowOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة سجل الحضور</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="row-date">التاريخ</Label>
                <Input
                  id="row-date"
                  type="date"
                  value={rowDate}
                  onChange={(e) => setRowDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="entry1">وقت الدخول 1</Label>
                  <Input
                    id="entry1"
                    type="time"
                    value={rowEntry1}
                    onChange={(e) => setRowEntry1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exit1">وقت الخروج 1</Label>
                  <Input
                    id="exit1"
                    type="time"
                    value={rowExit1}
                    onChange={(e) => setRowExit1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry2">وقت الدخول 2</Label>
                  <Input
                    id="entry2"
                    type="time"
                    value={rowEntry2}
                    onChange={(e) => setRowEntry2(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exit2">وقت الخروج 2</Label>
                  <Input
                    id="exit2"
                    type="time"
                    value={rowExit2}
                    onChange={(e) => setRowExit2(e.target.value)}
                  />
                </div>
              </div>
              {addRowErr && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {addRowErr}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">إلغاء</Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  setAddRowErr(null);
                  if (!selectedEmpId) {
                    setAddRowErr('اختر موظفاً أولاً');
                    return;
                  }
                  setAddingRow(true);
                  const payload = {
                    employee_id: selectedEmpId,
                    work_date: rowDate,
                    entry1: rowEntry1 || null,
                    exit1: rowExit1 || null,
                    entry2: rowEntry2 || null,
                    exit2: rowExit2 || null,
                  } as any;
                  try {
                    await fetchJson('/api/attendance', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    setAddRowOpen(false);
                    setRowEntry1('');
                    setRowExit1('');
                    setRowEntry2('');
                    setRowExit2('');
                    await loadRows(selectedEmpId, year, month);
                  } catch {
                    setAddRowErr('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
                  } finally {
                    setAddingRow(false);
                  }
                }}
                disabled={addingRow}
              >
                {addingRow ? 'جارٍ الحفظ…' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سجل الحضور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="edit-entry1">وقت الدخول 1</Label>
                <Input
                  id="edit-entry1"
                  type="time"
                  value={editEntry1}
                  onChange={(e) => setEditEntry1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-exit1">وقت الخروج 1</Label>
                <Input
                  id="edit-exit1"
                  type="time"
                  value={editExit1}
                  onChange={(e) => setEditExit1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-entry2">وقت الدخول 2</Label>
                <Input
                  id="edit-entry2"
                  type="time"
                  value={editEntry2}
                  onChange={(e) => setEditEntry2(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-exit2">وقت الخروج 2</Label>
                <Input
                  id="edit-exit2"
                  type="time"
                  value={editExit2}
                  onChange={(e) => setEditExit2(e.target.value)}
                />
              </div>
            </div>
            {editErr && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {editErr}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={saveEditRow} disabled={editing}>
              {editing ? 'جارٍ التحديث…' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سجل الحضور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السجل؟ لن يمكن استعادته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAttendanceRow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delEmp} onOpenChange={(o) => !o && setDelEmp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف &quot;{delEmp?.full_name}&quot;؟ سيتم حذف جميع
              سجلات الحضور المرتبطة به نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmp}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function AttendanceSheet({
  empName,
  monthLabel,
  grid,
  onEditRow,
  onDeleteRow,
}: {
  empName: string;
  monthLabel: string;
  grid: { iso: string; day: number; dayName: string; row: AttendanceRow | null }[];
  onEditRow: (row: AttendanceRow) => void;
  onDeleteRow: (row: AttendanceRow) => void;
}) {
  return (
    <div className="print-area overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border bg-muted/40 px-6 py-5 text-center">
        <h1 className="text-2xl font-bold text-foreground">إثبات الحضور</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          اسم المتعاون:{' '}
          <span className="font-bold text-foreground">{empName}</span>
          <span className="mx-3">|</span>
          الشهر:{' '}
          <span className="font-bold text-foreground">{monthLabel}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <Th>الأيام</Th>
              <Th>التاريخ</Th>
              <Th>وقت الدخول ١</Th>
              <Th>وقت الخروج ١</Th>
              <Th>وقت الدخول ٢</Th>
              <Th>وقت الخروج ٢</Th>
              <Th>التأخير</Th>
              <Th>الإجراء</Th>
            </tr>
          </thead>
          <tbody>
            {grid.map((g) => {
              const r = g.row;
              const delay = r ? totalDelay(r) : 0;
              const isFriday = g.dayName === 'الجمعة';
              return (
                <tr
                  key={g.iso}
                  className={`border-b border-border/60 ${
                    isFriday ? 'bg-muted/20' : 'hover:bg-muted/10'
                  }`}
                >
                  <Td className="font-medium">{g.dayName}</Td>
                  <Td className="tabular-nums">{formatDDMMYYYY(g.iso)}</Td>
                  <Td className="tabular-nums">{r?.entry1 ?? '—'}</Td>
                  <Td className="tabular-nums">{r?.exit1 ?? '—'}</Td>
                  <Td className="tabular-nums">{r?.entry2 ?? '—'}</Td>
                  <Td className="tabular-nums">{r?.exit2 ?? '—'}</Td>
                  <Td>
                    {delay > 0 ? (
                      <span className="font-medium text-destructive">
                        {minutesToHuman(delay)}
                      </span>
                    ) : r?.entry1 ? (
                      <span className="text-success">0 د</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="space-x-2 text-left">
                    {r ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEditRow(r)}
                          className="rounded-lg border border-border bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80"
                          title="تعديل"
                        >
                          <Pencil className="inline h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(r)}
                          className="rounded-lg border border-border bg-muted px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                          title="حذف"
                        >
                          <Trash2 className="inline h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
        دوام العمل: ٠٧:٣٠ صباحاً حتى ١٦:٣٠ مساءً • استراحة ٦٠ دقيقة
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-3 text-right text-xs font-bold text-muted-foreground">
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2.5 text-right ${className}`}>{children}</td>;
}
