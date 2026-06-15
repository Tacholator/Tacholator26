import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Fuel, ChevronLeft, ChevronRight, Droplets, PoundSterling, Gauge } from 'lucide-react';
import moment from 'moment';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getWeeksInMonth(year, month) {
  // Returns array of { weekNumber, weekStartDate (Monday), label }
  const weeks = [];
  const firstDay = moment({ year, month: month - 1, day: 1 });
  const lastDay = moment({ year, month: month - 1, day: 1 }).endOf('month');

  // Start from the Monday on or before the first day
  let current = firstDay.clone().startOf('isoWeek');
  let weekNum = 1;

  while (current.isSameOrBefore(lastDay)) {
    const weekEnd = current.clone().endOf('isoWeek');
    weeks.push({
      weekNumber: weekNum,
      weekStartDate: current.format('YYYY-MM-DD'),
      label: `Week ${weekNum}: ${current.format('D MMM')} – ${weekEnd.format('D MMM')}`
    });
    current.add(1, 'week');
    weekNum++;
  }
  return weeks;
}

function FillRow({ fill, index, onChange, onRemove, isOnly }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
      <div>
        <Label className="text-xs text-slate-500">Litres</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={fill.litres || ''}
          onChange={e => onChange(index, 'litres', parseFloat(e.target.value) || '')}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Amount (£)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={fill.amountGbp || ''}
          onChange={e => onChange(index, 'amountGbp', parseFloat(e.target.value) || '')}
        />
      </div>
      <div>
        <Label className="text-xs text-slate-500">Date</Label>
        <Input
          type="date"
          value={fill.date || ''}
          onChange={e => onChange(index, 'date', e.target.value)}
        />
      </div>
      <button
        onClick={() => onRemove(index)}
        disabled={isOnly}
        className="mb-0.5 p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function WeekFormModal({ open, onOpenChange, existingRecord, weekInfo, instructorId, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!existingRecord?.id;

  const defaultFill = { litres: '', amountGbp: '', date: weekInfo?.weekStartDate || '', note: '' };

  const [startMileage, setStartMileage] = useState('');
  const [endMileage, setEndMileage] = useState('');
  const [fills, setFills] = useState([{ ...defaultFill }]);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (open) {
      if (isEdit) {
        setStartMileage(existingRecord.startMileage || '');
        setEndMileage(existingRecord.endMileage || '');
        setFills(existingRecord.fills?.length ? existingRecord.fills : [{ ...defaultFill }]);
        setNotes(existingRecord.notes || '');
      } else {
        setStartMileage(existingRecord?.startMileage || '');
        setEndMileage('');
        setFills([{ ...defaultFill }]);
        setNotes('');
      }
    }
  }, [open, isEdit]);

  const handleFillChange = (index, field, value) => {
    setFills(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const addFill = () => setFills(prev => [...prev, { ...defaultFill }]);
  const removeFill = (index) => setFills(prev => prev.filter((_, i) => i !== index));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        instructorId,
        weekStartDate: weekInfo.weekStartDate,
        year: weekInfo.year,
        month: weekInfo.month,
        weekNumber: weekInfo.weekNumber,
        startMileage: parseFloat(startMileage) || null,
        endMileage: parseFloat(endMileage) || null,
        fills: fills.filter(f => f.litres || f.amountGbp),
        notes
      };
      if (isEdit) {
        return base44.entities.FuelExpense.update(existingRecord.id, payload);
      }
      return base44.entities.FuelExpense.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelExpenses', instructorId] });
      toast({ title: isEdit ? 'Expense updated' : 'Expense saved' });
      onSaved();
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' })
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Weekly Fuel Expense</DialogTitle>
          <p className="text-sm text-slate-500">{weekInfo?.label}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mileage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start of Week Mileage</Label>
              <Input
                type="number"
                placeholder="e.g. 45000"
                value={startMileage}
                onChange={e => setStartMileage(e.target.value)}
              />
            </div>
            <div>
              <Label>End of Week Mileage</Label>
              <Input
                type="number"
                placeholder="e.g. 45800"
                value={endMileage}
                onChange={e => setEndMileage(e.target.value)}
              />
            </div>
          </div>

          {/* Fuel fills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Fuel Fill-ups</Label>
              <Button size="sm" variant="outline" onClick={addFill} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Top-up
              </Button>
            </div>
            <div className="space-y-2">
              {fills.map((fill, i) => (
                <FillRow
                  key={i}
                  fill={fill}
                  index={i}
                  onChange={handleFillChange}
                  onRemove={removeFill}
                  isOnly={fills.length === 1}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WeekCard({ week, record, onEdit, onDelete }) {
  const totalLitres = record?.fills?.reduce((s, f) => s + (parseFloat(f.litres) || 0), 0) || 0;
  const totalAmount = record?.fills?.reduce((s, f) => s + (parseFloat(f.amountGbp) || 0), 0) || 0;
  const mileage = (record?.endMileage && record?.startMileage)
    ? record.endMileage - record.startMileage
    : null;

  return (
    <Card className={`border ${record ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">{week.label}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(week, record)} className="p-1.5 text-slate-400 hover:text-[#071739] rounded">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {record && (
              <button onClick={() => onDelete(record)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {record ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <Gauge className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Miles</p>
              <p className="text-sm font-bold text-slate-800">{mileage !== null ? mileage.toLocaleString() : '–'}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <Droplets className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Litres</p>
              <p className="text-sm font-bold text-slate-800">{totalLitres > 0 ? totalLitres.toFixed(1) : '–'}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <PoundSterling className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Spent</p>
              <p className="text-sm font-bold text-slate-800">{totalAmount > 0 ? `£${totalAmount.toFixed(2)}` : '–'}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">No data entered</p>
        )}

        {record?.fills?.length > 1 && (
          <p className="text-[10px] text-slate-400 mt-2">{record.fills.length} fill-ups recorded</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function InstructorExpenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = moment();

  const [selectedYear, setSelectedYear] = useState(now.year());
  const [selectedMonth, setSelectedMonth] = useState(now.month() + 1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: expenses = [] } = useQuery({
    queryKey: ['fuelExpenses', user?.id],
    queryFn: () => base44.entities.FuelExpense.filter({ instructorId: user.id }),
    enabled: !!user?.id
  });

  const weeks = useMemo(() => getWeeksInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const monthExpenses = useMemo(() =>
    expenses.filter(e => e.year === selectedYear && e.month === selectedMonth),
    [expenses, selectedYear, selectedMonth]
  );

  const getRecordForWeek = (weekStartDate) =>
    monthExpenses.find(e => e.weekStartDate === weekStartDate) || null;

  // Monthly totals
  const monthTotals = useMemo(() => {
    let totalMiles = 0, totalLitres = 0, totalAmount = 0, weekCount = 0;
    monthExpenses.forEach(e => {
      if (e.startMileage && e.endMileage) totalMiles += (e.endMileage - e.startMileage);
      totalLitres += e.fills?.reduce((s, f) => s + (parseFloat(f.litres) || 0), 0) || 0;
      totalAmount += e.fills?.reduce((s, f) => s + (parseFloat(f.amountGbp) || 0), 0) || 0;
      weekCount++;
    });
    return { totalMiles, totalLitres, totalAmount, weekCount };
  }, [monthExpenses]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const handleEdit = (week, record) => {
    let recordToEdit = record || null;
    // Auto-populate start mileage from previous week's end mileage if no record yet
    if (!record) {
      const weekIndex = weeks.findIndex(w => w.weekStartDate === week.weekStartDate);
      if (weekIndex > 0) {
        const prevWeekStart = weeks[weekIndex - 1].weekStartDate;
        const prevRecord = getRecordForWeek(prevWeekStart);
        if (prevRecord?.endMileage) {
          recordToEdit = { startMileage: prevRecord.endMileage };
        }
      } else {
        // First week of month — look in previous month's expenses
        const prevMonthExpenses = expenses.filter(e => {
          if (selectedMonth === 1) return e.year === selectedYear - 1 && e.month === 12;
          return e.year === selectedYear && e.month === selectedMonth - 1;
        });
        if (prevMonthExpenses.length > 0) {
          const lastPrev = prevMonthExpenses.reduce((a, b) => 
            new Date(a.weekStartDate) > new Date(b.weekStartDate) ? a : b
          );
          if (lastPrev?.endMileage) {
            recordToEdit = { startMileage: lastPrev.endMileage };
          }
        }
      }
    }
    setEditingWeek({ ...week, year: selectedYear, month: selectedMonth });
    setEditingRecord(recordToEdit);
    setModalOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (record) => base44.entities.FuelExpense.delete(record.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelExpenses', user?.id] });
      toast({ title: 'Entry deleted' });
    }
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#F7B602]/10 rounded-xl flex items-center justify-center">
          <Fuel className="w-5 h-5 text-[#F7B602]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#071739]">Expenses</h1>
          <p className="text-sm text-slate-500">Track your weekly fuel costs</p>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={handlePrevMonth} className="p-2 rounded-lg border hover:bg-slate-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-[#071739]">{MONTHS[selectedMonth - 1]} {selectedYear}</h2>
        <button onClick={handleNextMonth} className="p-2 rounded-lg border hover:bg-slate-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Summary */}
      {monthTotals.weekCount > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Total Miles</p>
            <p className="text-lg font-bold text-slate-800">{monthTotals.totalMiles.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <Droplets className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Total Litres</p>
            <p className="text-lg font-bold text-slate-800">{monthTotals.totalLitres.toFixed(1)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <PoundSterling className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Total Spent</p>
            <p className="text-lg font-bold text-slate-800">£{monthTotals.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Week Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {weeks.map(week => {
          const record = getRecordForWeek(week.weekStartDate);
          return (
            <WeekCard
              key={week.weekStartDate}
              week={week}
              record={record}
              onEdit={handleEdit}
              onDelete={deleteMutation.mutate}
            />
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && editingWeek && (
        <WeekFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          existingRecord={editingRecord}
          weekInfo={editingWeek}
          instructorId={user?.id}
          onSaved={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}