import React, { useState, useEffect } from 'react';
import { 
  fetchDashboard, 
  createExpense, 
  payExpense, 
  deleteExpense, 
  updateBudget 
} from './services/api';
import { 
  Wallet, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Calendar, 
  X,
  CreditCard,
  Home,
  Zap,
  Tv,
  Layers,
  AlertTriangle,
  ArrowRight,
  Percent
} from 'lucide-react';

const CATEGORY_ICONS = {
  'home': Home,
  'zap': Zap,
  'credit-card': CreditCard,
  'tv': Tv,
  'wallet': Wallet
};

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Vivienda', icon: 'home', color: '#E06D53' },
  { id: 2, name: 'Servicios', icon: 'zap', color: '#D97706' },
  { id: 3, name: 'Cuota', icon: 'credit-card', color: '#6366F1' },
  { id: 4, name: 'Entretenimiento', icon: 'tv', color: '#8B5CF6' }
];

// Formateador numérico argentino con punto para miles (ej: 5.000, 50.000, 150.000)
const formatMoney = (val) => {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const DEFAULT_DATA = {
  currentPeriodName: 'Agosto 2026',
  metrics: { 
    budget: 520000, 
    totalFixedCommitted: 325000, 
    totalEventualCommitted: 55000, 
    totalCommitted: 380000, 
    totalPaid: 14200, 
    available: 140000, 
    percentage: 73, 
    status: 'NORMAL' 
  },
  categories: DEFAULT_CATEGORIES,
  expenses: [
    {
      id: 1,
      title: 'Alquiler Departamento',
      category_id: 1,
      category_name: 'Vivienda',
      category_icon: 'home',
      expense_type: 'FIJO',
      estimated_amount: 280000,
      due_date: '2026-08-10',
      priority: 'ALTA',
      status: 'PENDIENTE',
      dynamic_status: 'PENDIENTE',
      actual_paid_amount: null,
      notes: 'Transferencia al dueño antes del 10'
    },
    {
      id: 2,
      title: 'Expensas Edificio',
      category_id: 1,
      category_name: 'Vivienda',
      category_icon: 'home',
      expense_type: 'FIJO',
      estimated_amount: 45000,
      due_date: '2026-08-25',
      priority: 'MEDIA',
      status: 'PENDIENTE',
      dynamic_status: 'PENDIENTE',
      actual_paid_amount: null,
      notes: 'Pago por Rapipago/VEP'
    },
    {
      id: 3,
      title: 'Aguas Cordobesas',
      category_id: 2,
      category_name: 'Servicios',
      category_icon: 'zap',
      expense_type: 'FIJO',
      estimated_amount: 14200,
      due_date: '2026-08-05',
      priority: 'ALTA',
      status: 'PENDIENTE',
      dynamic_status: 'VENCIDO',
      actual_paid_amount: null,
      notes: 'Factura vencida de prueba'
    },
    {
      id: 4,
      title: 'Factura de Gas',
      category_id: 2,
      category_name: 'Servicios',
      category_icon: 'zap',
      expense_type: 'FIJO',
      estimated_amount: 18500,
      due_date: '2025-05-11',
      priority: 'ALTA',
      status: 'PENDIENTE',
      dynamic_status: 'VENCIDO',
      actual_paid_amount: null,
      notes: 'Deuda de prueba mayo 2025'
    },
    {
      id: 5,
      title: 'Remera Deportiva (Cuota 1/3)',
      category_id: 3,
      category_name: 'Cuota',
      category_icon: 'credit-card',
      expense_type: 'EVENTUAL',
      estimated_amount: 55000,
      due_date: '2026-08-18',
      priority: 'MEDIA',
      status: 'PENDIENTE',
      dynamic_status: 'PENDIENTE',
      installment_current: 1,
      installment_total: 3,
      notes: 'Cuota 1 de 3 ($165.000 total)'
    }
  ]
};

export default function App() {
  const [viewMode, setViewMode] = useState('welcome');
  const [data, setData] = useState(DEFAULT_DATA);
  const [filter, setFilter] = useState('TODOS');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Fechas corrientes
  const todayObj = new Date();
  const yearPad = todayObj.getFullYear();
  const monthPad = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dayPad = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${yearPad}-${monthPad}-${dayPad}`;
  const currentPeriodYM = `${yearPad}-${monthPad}`; // "2026-08"

  // Rango para Vencimientos: 1 mes antes (Julio 2026) hasta 2 meses después (Octubre 2026)
  const allowedDueDatePeriods = [
    { ym: '2026-07', label: 'Julio 2026', year: '2026', month: '07' },
    { ym: '2026-08', label: 'Agosto 2026', year: '2026', month: '08' },
    { ym: '2026-09', label: 'Septiembre 2026', year: '2026', month: '09' },
    { ym: '2026-10', label: 'Octubre 2026', year: '2026', month: '10' }
  ];

  // Estado para selector de fecha de vencimiento
  const [duePeriodIndex, setDuePeriodIndex] = useState(1); // Agosto 2026 por defecto
  const [dueDayPart, setDueDayPart] = useState(dayPad);

  // Estado para selector de fecha de pago: Desde el 1 del mes hasta el día de HOY
  const currentDayNum = todayObj.getDate();
  const allowedPayDays = Array.from({ length: currentDayNum }, (_, i) => String(i + 1).padStart(2, '0'));
  const [payDayPart, setPayDayPart] = useState(dayPad);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '1',
    expense_type: 'FIJO',
    base_amount: '',
    estimated_amount: '',
    notes: '',
    installment_current: 1,
    installment_total: 3,
    has_interest: 'NO',
    interest_rate: '10',
    remember_next_month: 'YES'
  });

  const [payData, setPayData] = useState({
    actual_paid_amount: '',
    payment_date: todayStr,
    note: ''
  });

  const [newBudget, setNewBudget] = useState('');

  // Lógica Dinámica de Prioridades:
  // - Vencida o <= 3 días: ALTA (Rojo)
  // - 4 a 15 días: MEDIA (Amarillo)
  // - Más de 15 días: BAJA (Verde)
  const computeStatusAndPriority = (dueDateStr, isPaid) => {
    if (isPaid) return { status: 'PAGADO', priority: 'BAJA' };
    if (!dueDateStr) return { status: 'PENDIENTE', priority: 'MEDIA' };

    const parts = dueDateStr.split('T')[0].split('-');
    if (parts.length < 3) return { status: 'PENDIENTE', priority: 'MEDIA' };

    const dueY = parseInt(parts[0], 10);
    const dueM = parseInt(parts[1], 10) - 1;
    const dueD = parseInt(parts[2], 10);

    const due = new Date(dueY, dueM, dueD);
    const curr = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());

    if (curr > due) {
      return { status: 'VENCIDO', priority: 'ALTA' };
    }

    const diffTime = due.getTime() - curr.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      return { status: 'PROXIMO_VENCER', priority: 'ALTA' };
    }

    if (diffDays >= 4 && diffDays <= 15) {
      return { status: 'PENDIENTE', priority: 'MEDIA' };
    }

    return { status: 'PENDIENTE', priority: 'BAJA' };
  };

  // Recálculo de métricas filtrando ÚNICAMENTE las obligaciones del mes corriente (Agosto 2026) o vencidos pasados
  const recalculateDataMetrics = (currentBudget, expensesList) => {
    const budgetNum = Number(currentBudget) || 0;
    const rawExpenses = Array.isArray(expensesList) ? expensesList : [];

    const expenses = rawExpenses.map(exp => {
      const { status: compStatus, priority: compPriority } = computeStatusAndPriority(exp.due_date, exp.status === 'PAGADO');
      return {
        ...exp,
        dynamic_status: compStatus,
        effective_priority: compPriority
      };
    });

    // Filtrar estrictamente para Agosto 2026: los de meses futuros (Septiembre, Octubre) NO computan en comprometido ni saldo libre
    const currentPeriodExpenses = expenses.filter(e => {
      if (e.dynamic_status === 'VENCIDO') return true;
      if (e.due_date) {
        const expYM = e.due_date.substring(0, 7);
        return expYM === currentPeriodYM;
      }
      return false;
    });

    const fixed = currentPeriodExpenses.filter(e => e.expense_type === 'FIJO');
    const eventual = currentPeriodExpenses.filter(e => e.expense_type === 'EVENTUAL');

    const totalFixedCommitted = fixed.reduce((s, e) => {
      const amt = e.actual_paid_amount ? Number(e.actual_paid_amount) : Number(e.estimated_amount || 0);
      return s + amt;
    }, 0);

    const totalEventualCommitted = eventual.reduce((s, e) => {
      const amt = e.actual_paid_amount ? Number(e.actual_paid_amount) : Number(e.estimated_amount || 0);
      return s + amt;
    }, 0);

    const totalCommitted = totalFixedCommitted + totalEventualCommitted;

    const totalPaid = currentPeriodExpenses.reduce((s, e) => {
      if (e.dynamic_status === 'PAGADO' || e.status === 'PAGADO') {
        return s + Number(e.actual_paid_amount || e.estimated_amount || 0);
      }
      return s;
    }, 0);

    const available = budgetNum - totalCommitted;
    const percentage = budgetNum > 0 ? Math.round((totalCommitted / budgetNum) * 100) : 0;

    let status = 'NORMAL';
    if (percentage >= 100) status = 'EXCEDIDO';
    else if (percentage >= 80) status = 'ADVERTENCIA';

    return {
      budget: budgetNum,
      totalFixedCommitted,
      totalEventualCommitted,
      totalCommitted,
      totalPaid,
      available,
      percentage,
      status,
      processedExpenses: expenses
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboard();
      if (res && res.expenses) {
        const { processedExpenses, ...metrics } = recalculateDataMetrics(res.metrics?.budget || res.budget || 520000, res.expenses);
        setData({
          ...res,
          categories: DEFAULT_CATEGORIES,
          expenses: processedExpenses,
          metrics
        });
      } else {
        const { processedExpenses, ...metrics } = recalculateDataMetrics(DEFAULT_DATA.metrics.budget, DEFAULT_DATA.expenses);
        setData({ ...DEFAULT_DATA, expenses: processedExpenses, metrics });
      }
    } catch (err) {
      const { processedExpenses, ...metrics } = recalculateDataMetrics(DEFAULT_DATA.metrics.budget, DEFAULT_DATA.expenses);
      setData({ ...DEFAULT_DATA, expenses: processedExpenses, metrics });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeExpenses = data?.expenses || DEFAULT_DATA.expenses;
  const safeCategories = DEFAULT_CATEGORIES;
  const safeMetrics = data?.metrics || DEFAULT_DATA.metrics;

  // Filtrado visual estricto: En el mes de Agosto 2026 NO figuran gastos de Septiembre ni meses futuros
  const currentViewableExpenses = safeExpenses.filter(e => {
    if (e.dynamic_status === 'VENCIDO') return true;
    if (e.due_date) {
      const expYM = e.due_date.substring(0, 7);
      return expYM === currentPeriodYM;
    }
    return false;
  });

  const selectedPeriodObj = allowedDueDatePeriods[duePeriodIndex] || allowedDueDatePeriods[1];
  const selectedDueDate = `${selectedPeriodObj.year}-${selectedPeriodObj.month}-${dueDayPart}`;

  // Cálculo de Cuotas con Interés sobre el Total:
  const isCuotaCategory = safeCategories.find(c => String(c.id) === String(formData.category_id))?.name === 'Cuota';
  
  const basePriceNum = Number(formData.base_amount) || 0;
  const interestRateNum = formData.has_interest === 'YES' ? (Number(formData.interest_rate) || 0) : 0;
  const totalPriceCalculated = Math.round(basePriceNum * (1 + (interestRateNum / 100)));
  const totalInstallmentCount = Math.max(1, Number(formData.installment_total) || 1);
  const calculatedInstallmentAmount = Math.round(totalPriceCalculated / totalInstallmentCount);

  const effectiveAmountToUse = isCuotaCategory 
    ? calculatedInstallmentAmount 
    : (Number(formData.estimated_amount) || 0);

  const isDuplicateTitle = safeExpenses.some(exp => 
    exp.title && exp.title.trim().toLowerCase() === formData.title.trim().toLowerCase()
  );

  const isTitleValid = formData.title.trim().length > 0 && !isDuplicateTitle;
  const isAmountValid = isCuotaCategory ? basePriceNum > 0 : Number(formData.estimated_amount) > 0;
  const isFormValid = isTitleValid && isAmountValid;

  const simulatedCommitted = (safeMetrics.totalCommitted || 0) + effectiveAmountToUse;
  const simulatedPercentage = (safeMetrics.budget || 520000) > 0 
    ? Math.min(100, Math.round((simulatedCommitted / safeMetrics.budget) * 100)) 
    : 100;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const catObj = safeCategories.find(c => String(c.id) === String(formData.category_id)) || safeCategories[0];
    let titleText = formData.title.trim();

    if (isCuotaCategory && !titleText.includes('Cuota')) {
      titleText = `${titleText} (Cuota ${formData.installment_current}/${formData.installment_total})`;
    }

    const { status: initStatus, priority: initPriority } = computeStatusAndPriority(selectedDueDate, false);

    const newExpItem = {
      id: Date.now(),
      title: titleText,
      category_id: Number(formData.category_id),
      category_name: catObj.name,
      category_icon: catObj.icon || 'wallet',
      expense_type: isCuotaCategory ? 'EVENTUAL' : (formData.expense_type === 'EVENTUAL' ? 'EVENTUAL' : 'FIJO'),
      estimated_amount: effectiveAmountToUse,
      due_date: selectedDueDate,
      priority: initPriority,
      status: 'PENDIENTE',
      dynamic_status: initStatus,
      effective_priority: initPriority,
      actual_paid_amount: null,
      installment_current: isCuotaCategory ? Number(formData.installment_current) : null,
      installment_total: isCuotaCategory ? Number(formData.installment_total) : null,
      notes: isCuotaCategory 
        ? `Precio total: $${formatMoney(totalPriceCalculated)} (${formData.installment_total} cuotas de $${formatMoney(calculatedInstallmentAmount)})`
        : (formData.notes || '')
    };

    let updatedList = [newExpItem, ...safeExpenses];

    // Generar cuota N+1 para el mes que viene (NO aparece en la lista de Agosto)
    if (isCuotaCategory && Number(formData.installment_current) < Number(formData.installment_total)) {
      const nextNum = Number(formData.installment_current) + 1;
      const totalNum = Number(formData.installment_total);
      
      const dueParts = selectedDueDate.split('-');
      const dYear = parseInt(dueParts[0], 10);
      const dMonth = parseInt(dueParts[1], 10);
      const dDay = dueParts[2];

      let nextYear = dYear;
      let nextMonth = dMonth + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      const nextDueDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${dDay}`;
      const cleanBaseConcept = formData.title.trim().replace(/\s*\(Cuota \d+\/\d+\)/, '');

      const { status: nextInitStatus, priority: nextInitPriority } = computeStatusAndPriority(nextDueDateStr, false);

      const nextCuotaItem = {
        id: Date.now() + 1,
        title: `${cleanBaseConcept} (Cuota ${nextNum}/${totalNum})`,
        category_id: Number(formData.category_id),
        category_name: catObj.name,
        category_icon: catObj.icon || 'wallet',
        expense_type: 'EVENTUAL',
        estimated_amount: calculatedInstallmentAmount,
        due_date: nextDueDateStr,
        priority: nextInitPriority,
        status: 'PENDIENTE',
        dynamic_status: nextInitStatus,
        effective_priority: nextInitPriority,
        actual_paid_amount: null,
        installment_current: nextNum,
        installment_total: totalNum,
        notes: `Programado para el mes correspondiente ($${formatMoney(calculatedInstallmentAmount)})`
      };

      updatedList = [nextCuotaItem, ...updatedList];
    }

    // Gasto Fijo Recurrente para el próximo mes (Septiembre) — NO aparece en la lista de Agosto
    if (!isCuotaCategory && formData.expense_type === 'FIJO' && formData.remember_next_month === 'YES') {
      const dueParts = selectedDueDate.split('-');
      const dYear = parseInt(dueParts[0], 10);
      const dMonth = parseInt(dueParts[1], 10);
      const dDay = dueParts[2];

      let nextYear = dYear;
      let nextMonth = dMonth + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      const nextDueDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${dDay}`;
      const { status: nextFixedStatus, priority: nextFixedPriority } = computeStatusAndPriority(nextDueDateStr, false);

      const nextFixedItem = {
        id: Date.now() + 2,
        title: `${formData.title.trim()} (Septiembre)`,
        category_id: Number(formData.category_id),
        category_name: catObj.name,
        category_icon: catObj.icon || 'wallet',
        expense_type: 'FIJO',
        estimated_amount: Number(formData.estimated_amount),
        due_date: nextDueDateStr,
        priority: nextFixedPriority,
        status: 'PENDIENTE',
        dynamic_status: nextFixedStatus,
        effective_priority: nextFixedPriority,
        actual_paid_amount: null,
        notes: 'Recordatorio automático para Septiembre (monto editable)'
      };

      updatedList = [nextFixedItem, ...updatedList];
    }

    const { processedExpenses, ...updatedMetrics } = recalculateDataMetrics(safeMetrics.budget, updatedList);

    setData(prev => ({
      ...prev,
      expenses: processedExpenses,
      metrics: updatedMetrics
    }));

    try {
      await createExpense(newExpItem);
    } catch (err) {
      console.warn('Guardado en memoria local:', err.message);
    }

    setShowAddModal(false);
    setFormData({
      title: '',
      category_id: '1',
      expense_type: 'FIJO',
      base_amount: '',
      estimated_amount: '',
      notes: '',
      installment_current: 1,
      installment_total: 3,
      has_interest: 'NO',
      interest_rate: '10',
      remember_next_month: 'YES'
    });
  };

  // Al pagar con recargo por mora, la diferencia incrementa el total pagado/comprometido y RESTA del saldo libre
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    const paidAmt = Number(payData.actual_paid_amount) || selectedExpense.estimated_amount;
    const selectedPayDate = `${yearPad}-${monthPad}-${payDayPart}`;

    const updatedRaw = safeExpenses.map(exp => {
      if (exp.id === selectedExpense.id) {
        return {
          ...exp,
          status: 'PAGADO',
          dynamic_status: 'PAGADO',
          actual_paid_amount: paidAmt,
          paid_at: selectedPayDate
        };
      }
      return exp;
    });

    const { processedExpenses, ...updatedMetrics } = recalculateDataMetrics(safeMetrics.budget, updatedRaw);

    setData(prev => ({
      ...prev,
      expenses: processedExpenses,
      metrics: updatedMetrics
    }));

    try {
      const res = await payExpense(selectedExpense.id, { ...payData, payment_date: selectedPayDate });
      if (res && res.surchargeAmount > 0) {
        alert(`ℹ️ Pago registrado con recargo por mora: +$${formatMoney(res.surchargeAmount)}. Este recargo se descontó directamente de tu saldo libre.`);
      }
    } catch (err) {
      console.warn('Pago actualizado en memoria local');
    }

    setShowPayModal(false);
    setSelectedExpense(null);
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    const amount = Number(newBudget);
    if (isNaN(amount) || amount <= 0) return;

    const { processedExpenses, ...updatedMetrics } = recalculateDataMetrics(amount, safeExpenses);

    setData(prev => ({
      ...prev,
      expenses: processedExpenses,
      metrics: updatedMetrics
    }));

    try {
      await updateBudget(amount);
    } catch (err) {
      console.warn('Presupuesto actualizado localmente');
    }

    setShowBudgetModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro de eliminar esta obligación?')) return;
    
    const updatedRaw = safeExpenses.filter(e => e.id !== id);
    const { processedExpenses, ...updatedMetrics } = recalculateDataMetrics(safeMetrics.budget, updatedRaw);

    setData(prev => ({
      ...prev,
      expenses: processedExpenses,
      metrics: updatedMetrics
    }));

    try {
      await deleteExpense(id);
    } catch (err) {
      console.warn('Eliminado localmente');
    }
  };

  const filteredExpenses = currentViewableExpenses.filter(exp => {
    if (filter === 'TODOS') return true;
    if (filter === 'FIJO') return exp.expense_type === 'FIJO';
    if (filter === 'EVENTUAL') return exp.expense_type === 'EVENTUAL';
    if (filter === 'PENDIENTE') return exp.dynamic_status === 'PENDIENTE' || exp.dynamic_status === 'PROXIMO_VENCER';
    if (filter === 'PAGADO') return exp.dynamic_status === 'PAGADO';
    if (filter === 'VENCIDO') return exp.dynamic_status === 'VENCIDO';
    return true;
  });

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const [year, month, day] = parts;
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mIdx = parseInt(month, 10) - 1;
    return `Vence ${day} de ${monthNames[mIdx] || month} de ${year}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAGADO':
        return <span className="status-badge status-PAGADO"><CheckCircle2 size={13} /> PAGADO</span>;
      case 'VENCIDO':
        return <span className="status-badge status-VENCIDO"><AlertCircle size={13} /> VENCIDO</span>;
      case 'PROXIMO_VENCER':
        return <span className="status-badge status-PROXIMO_VENCER"><Clock size={13} /> PRÓXIMO</span>;
      default:
        return <span className="status-badge status-PENDIENTE"><Clock size={13} /> PENDIENTE</span>;
    }
  };

  const getBarColor = (perc) => {
    if (perc >= 100) return 'var(--accent-danger)';
    if (perc >= 80) return 'var(--accent-amber)';
    return 'var(--accent-sage)';
  };

  const currentInstallmentOptions = Array.from(
    { length: Number(formData.installment_total) || 1 }, 
    (_, i) => i + 1
  );

  // 1. Pantalla de Bienvenida Simplificada
  if (viewMode === 'welcome') {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh' }}>
        <div className="modal-content" style={{ maxWidth: '500px', padding: '40px 32px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <div className="brand-icon" style={{ width: '60px', height: '60px', margin: '0 auto 16px', borderRadius: '16px' }}>
            <Wallet size={32} />
          </div>
          
          <h1 style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            FinFix
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Sistema de Control de Gastos Mensuales
          </p>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px 18px', borderRadius: '999px', display: 'inline-block', marginBottom: '28px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-navy)' }}>
              Período: {data?.currentPeriodName || 'Agosto 2026'}
            </span>
          </div>

          <button 
            className="btn-primary" 
            onClick={() => setViewMode('dashboard')}
            style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: '1rem' }}
          >
            <span>Ver Mis Gastos y Obligaciones</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // 2. Pantalla Principal Dashboard
  return (
    <div className="container">
      <header className="app-header">
        <div className="brand" onClick={() => setViewMode('welcome')} style={{ cursor: 'pointer' }} title="Volver al Inicio">
          <div className="brand-icon">
            <Wallet size={24} />
          </div>
          <div className="brand-title">
            <h1>
              FinFix 
              <span className="period-pill">{data?.currentPeriodName || 'Agosto 2026'}</span>
            </h1>
            <p>Sistema de Control de Gastos Mensuales</p>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <PlusCircle size={18} />
          Agregar Obligación
        </button>
      </header>

      {/* Primary Metrics Row */}
      <div className="metrics-overview">
        <div className="metric-card interactive" onClick={() => { setNewBudget(safeMetrics.budget); setShowBudgetModal(true); }}>
          <div className="metric-header">
            <span>Presupuesto Mensual</span>
            <Wallet size={18} color="var(--accent-navy)" />
          </div>
          <div className="metric-value">${formatMoney(safeMetrics.budget)}</div>
          <div className="metric-sub">Haz clic para modificar objetivo</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Comprometido Total</span>
            <Clock size={18} color="var(--accent-amber)" />
          </div>
          <div className="metric-value">${formatMoney(safeMetrics.totalCommitted)}</div>
          <div className="health-bar-container">
            <div className="health-bar-track">
              <div 
                className="health-bar-fill" 
                style={{ 
                  width: `${Math.min(100, safeMetrics.percentage || 0)}%`,
                  backgroundColor: getBarColor(safeMetrics.percentage || 0)
                }}
              />
            </div>
            <div className="metric-sub" style={{ marginTop: '4px' }}>
              {safeMetrics.percentage || 0}% del presupuesto asignado
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Pagado a la Fecha</span>
            <CheckCircle2 size={18} color="var(--accent-sage)" />
          </div>
          <div className="metric-value">${formatMoney(safeMetrics.totalPaid)}</div>
          <div className="metric-sub">{currentViewableExpenses.filter(e => e.dynamic_status === 'PAGADO' || e.status === 'PAGADO').length} obligaciones liquidadas</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Saldo Libre Disponible</span>
            <AlertCircle size={18} color={(safeMetrics.available || 0) >= 0 ? "var(--accent-sage)" : "var(--accent-danger)"} />
          </div>
          <div className="metric-value" style={{ color: (safeMetrics.available || 0) >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
            ${formatMoney(safeMetrics.available)}
          </div>
          <div className="metric-sub">Estado: <strong>{safeMetrics.status || 'NORMAL'}</strong></div>
        </div>
      </div>

      {/* Breakdown: Gastos Fijos vs Eventuales */}
      <div className="breakdown-row">
        <div className="breakdown-box">
          <h4>
            <span>Gastos Fijos</span>
            <span style={{ color: '#3730A3' }}>${formatMoney(safeMetrics.totalFixedCommitted)}</span>
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alquiler, expensas y servicios indispensables.</p>
        </div>

        <div className="breakdown-box">
          <h4>
            <span>Eventuales</span>
            <span style={{ color: '#6B21A8' }}>${formatMoney(safeMetrics.totalEventualCommitted)}</span>
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Compras en cuotas, tarjetas o entretenimientos.</p>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="actions-bar">
        <div className="filters-group">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'FIJO', label: 'Solo Fijos' },
            { id: 'EVENTUAL', label: 'Eventuales' },
            { id: 'PENDIENTE', label: 'Pendientes' },
            { id: 'PAGADO', label: 'Pagados' },
            { id: 'VENCIDO', label: 'Vencidos' }
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {filteredExpenses.length} obligaciones registradas en el período
        </div>
      </div>

      {/* Expenses List */}
      <div className="expenses-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Cargando obligaciones...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            No hay obligaciones en este filtro para el período corriente (Agosto 2026).
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const IconComp = CATEGORY_ICONS[exp.category_icon] || Layers;
            const effectivePrio = exp.effective_priority || exp.priority || 'MEDIA';

            return (
              <div key={exp.id} className="expense-item">
                <div className="expense-info">
                  <div className="category-icon-badge">
                    <IconComp size={20} />
                  </div>
                  <div className="expense-details">
                    <h3>{exp.title}</h3>
                    <div className="expense-meta" style={{ gap: '16px' }}>
                      <span>Categoría: {exp.category_name || 'General'}</span>
                      <span>{formatDateLabel(exp.due_date)}</span>
                      
                      {/* Texto directo de prioridad coloreado sin recuadro */}
                      <span className={`prio-text prio-text-${effectivePrio}`}>
                        Prioridad {effectivePrio.toLowerCase()}
                      </span>

                      {exp.notes && (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{exp.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="expense-actions">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      ${formatMoney(exp.estimated_amount)}
                    </div>
                    {exp.actual_paid_amount && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-sage)', fontWeight: '600' }}>
                        Abonado: ${formatMoney(exp.actual_paid_amount)}
                      </div>
                    )}
                  </div>

                  {getStatusBadge(exp.dynamic_status)}

                  {exp.dynamic_status !== 'PAGADO' && (
                    <button 
                      className="btn-pay"
                      onClick={() => {
                        setSelectedExpense(exp);
                        setPayData({
                          actual_paid_amount: exp.estimated_amount,
                          payment_date: todayStr,
                          note: 'Pago registrado'
                        });
                        setPayDayPart(dayPad);
                        setShowPayModal(true);
                      }}
                    >
                      Pagar
                    </button>
                  )}

                  <button className="btn-delete" onClick={() => handleDelete(exp.id)} title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Agregar Gasto */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Agregar Obligación de Pago</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Concepto *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: Alquiler, Expensas, Remera"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                {isDuplicateTitle && (
                  <span className="validation-hint" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} /> Ya existe una obligación con este nombre. Utiliza un concepto distinto.
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Tipo de Gasto</label>
                  <select 
                    className="form-input"
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                  >
                    <option value="FIJO">Gasto Fijo</option>
                    <option value="EVENTUAL">Eventual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select 
                    className="form-input"
                    value={formData.category_id}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const selectedCat = safeCategories.find(c => String(c.id) === String(newCatId));
                      setFormData({ 
                        ...formData, 
                        category_id: newCatId,
                        expense_type: selectedCat?.name === 'Cuota' ? 'EVENTUAL' : formData.expense_type
                      });
                    }}
                  >
                    {safeCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lógica de Gasto Fijo Recurrente */}
              {!isCuotaCategory && formData.expense_type === 'FIJO' && (
                <div className="form-group" style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.remember_next_month === 'YES'}
                      onChange={(e) => setFormData({ ...formData, remember_next_month: e.target.checked ? 'YES' : 'NO' })}
                    />
                    <span>Recordar este gasto fijo automáticamente para el próximo mes (no figurará en Agosto)</span>
                  </label>
                </div>
              )}

              {/* Lógica de Cuotas con Interés sobre el Total */}
              {isCuotaCategory && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Precio Total del Producto ($) *</label>
                      <input 
                        type="number" 
                        min="1"
                        className="form-input" 
                        placeholder="Ej: 150000"
                        value={formData.base_amount}
                        onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Cantidad Total de Cuotas</label>
                      <select
                        className="form-input"
                        value={formData.installment_total}
                        onChange={(e) => {
                          const newTotal = Number(e.target.value);
                          setFormData({ 
                            ...formData, 
                            installment_total: newTotal,
                            installment_current: Math.min(formData.installment_current, newTotal)
                          });
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'cuota' : 'cuotas'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Cuota Actual que Abonás</label>
                      <select
                        className="form-input"
                        value={formData.installment_current}
                        onChange={(e) => setFormData({ ...formData, installment_current: Number(e.target.value) })}
                      >
                        {currentInstallmentOptions.map(n => (
                          <option key={n} value={n}>Cuota {n} de {formData.installment_total}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Interés en la Compra</label>
                      <select
                        className="form-input"
                        value={formData.has_interest}
                        onChange={(e) => setFormData({ ...formData, has_interest: e.target.value })}
                      >
                        <option value="NO">Sin Interés (0%)</option>
                        <option value="YES">Con Recargo de Interés</option>
                      </select>
                    </div>
                  </div>

                  {formData.has_interest === 'YES' && (
                    <div className="form-group">
                      <label>% Interés Total Aplicado</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="0.1"
                          className="form-input" 
                          placeholder="Ej: 10"
                          value={formData.interest_rate}
                          onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                          required
                        />
                        <Percent size={18} color="var(--text-secondary)" />
                      </div>
                    </div>
                  )}

                  {/* Resumen dinámico transparente del valor de cada cuota */}
                  {basePriceNum > 0 && (
                    <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <div>Precio Final con Interés: <strong>${formatMoney(totalPriceCalculated)}</strong></div>
                      <div>Valor de cada Cuota (1/{totalInstallmentCount}): <strong>${formatMoney(calculatedInstallmentAmount)}</strong></div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {!isCuotaCategory && (
                  <div className="form-group">
                    <label>Monto ($) *</label>
                    <input 
                      type="number" 
                      min="1"
                      className="form-input" 
                      placeholder="Ej: 45000"
                      value={formData.estimated_amount}
                      onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* Fecha de Vencimiento: Rango acotado desde 1 mes antes (Julio 2026) hasta 2 meses después (Octubre 2026) */}
                <div className="form-group" style={{ gridColumn: isCuotaCategory ? 'span 2' : 'span 1' }}>
                  <label>Fecha de Vencimiento *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '6px' }}>
                    <select
                      className="form-input"
                      value={duePeriodIndex}
                      onChange={(e) => setDuePeriodIndex(Number(e.target.value))}
                    >
                      {allowedDueDatePeriods.map((p, idx) => (
                        <option key={p.ym} value={idx}>{p.label}</option>
                      ))}
                    </select>

                    <select
                      className="form-input"
                      value={dueDayPart}
                      onChange={(e) => setDueDayPart(e.target.value)}
                    >
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d}>Día {d}</option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    Rango: 1 mes antes (Jul 2026) hasta 2 meses después (Oct 2026)
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Notas Adicionales</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: Pago antes del día 10"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Impacto estimado en el presupuesto:
                </div>
                <div className="health-bar-track">
                  <div 
                    className="health-bar-fill"
                    style={{ width: `${simulatedPercentage}%`, backgroundColor: getBarColor(simulatedPercentage) }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  Comprometido proyectado: {simulatedPercentage}%
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={!isFormValid}>Guardar Obligación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago: Rango estricto desde el 1 de Agosto de 2026 hasta HOY (Día 11 de Agosto de 2026) */}
      {showPayModal && selectedExpense && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Registrar Pago — {selectedExpense.title}</h2>
              <button className="btn-close" onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Monto a Abonar ($)</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={payData.actual_paid_amount}
                  onChange={(e) => setPayData({ ...payData, actual_paid_amount: e.target.value })}
                  disabled={selectedExpense.dynamic_status !== 'VENCIDO'}
                  required
                />
                {selectedExpense.dynamic_status !== 'VENCIDO' ? (
                  <span className="validation-hint" style={{ color: 'var(--text-secondary)' }}>
                    ℹ️ Al estar al día, se abona exactamente el monto fijado (${formatMoney(selectedExpense.estimated_amount)}).
                  </span>
                ) : Number(payData.actual_paid_amount) > selectedExpense.estimated_amount ? (
                  <span className="validation-hint" style={{ color: 'var(--accent-amber)' }}>
                    ⚠️ Incluye recargo por pago fuera de término (+$
                    {formatMoney(Number(payData.actual_paid_amount) - selectedExpense.estimated_amount)}). Este recargo reducirá tu saldo libre disponible.
                  </span>
                ) : Number(payData.actual_paid_amount) < selectedExpense.estimated_amount ? (
                  <span className="validation-hint">
                    ❌ No se permite abonar un monto menor al total adeudado (${formatMoney(selectedExpense.estimated_amount)}).
                  </span>
                ) : null}
              </div>

              <div className="form-group">
                <label>Fecha Efectiva de Pago *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '6px' }}>
                  <select className="form-input" disabled>
                    <option>Agosto 2026</option>
                  </select>
                  <select
                    className="form-input"
                    value={payDayPart}
                    onChange={(e) => setPayDayPart(e.target.value)}
                  >
                    {allowedPayDays.map(d => (
                      <option key={d} value={d}>Día {d}</option>
                    ))}
                  </select>
                </div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                  Permitido: Desde el 01/08/2026 hasta el día de HOY ({todayStr})
                </span>
              </div>

              <div className="form-group">
                <label>Comprobante / Observaciones</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej: Transferencia Banco N° 89123"
                  value={payData.note}
                  onChange={(e) => setPayData({ ...payData, note: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={Number(payData.actual_paid_amount) < selectedExpense.estimated_amount}
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Presupuesto */}
      {showBudgetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Ajustar Presupuesto Mensual</h2>
              <button className="btn-close" onClick={() => setShowBudgetModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateBudget} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Nuevo Presupuesto Total ($)</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBudgetModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Presupuesto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
