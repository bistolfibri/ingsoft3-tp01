/**
 * Módulo de Reglas de Negocio de FinFix (Con Regla Inteligente de Pago A Término vs Con Mora)
 */

export function isDuplicateExpenseTitle(existingExpenses, newTitle, currentExpenseId = null) {
  if (!newTitle || typeof newTitle !== 'string') return false;
  const cleanTitle = newTitle.trim().toLowerCase();
  
  return (existingExpenses || []).some(exp => 
    exp.id !== currentExpenseId && 
    exp.title && exp.title.trim().toLowerCase() === cleanTitle
  );
}

/**
 * Regla de Pago:
 * - Si la fecha efectiva de pago es EN O ANTES del vencimiento (paymentDate <= due_date),
 *   el pago se considera A TÉRMINO. Se exige el monto exacto sin recargo.
 * - Si la fecha efectiva de pago es POSTERIOR al vencimiento (paymentDate > due_date),
 *   el pago es CON MORA. Se permite ingresar recargo adicional.
 */
export function processPaymentData(expense, paidAmount, paymentDate = new Date()) {
  if (!expense) throw new Error('La obligación a abonar no existe');
  
  const estimated = Number(expense.estimated_amount) || 0;
  const amount = Number(paidAmount);
  
  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto abonado debe ser mayor a $0');
  }

  if (amount < estimated) {
    throw new Error(`El pago no puede ser menor al monto adeudado ($${formatMoneyNumber(estimated)})`);
  }

  const pDateStr = paymentDate ? new Date(paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const dDateStr = expense.due_date ? String(expense.due_date).split('T')[0] : pDateStr;

  const isPaidOnTime = pDateStr <= dDateStr;
  let surchargeAmount = 0;

  if (isPaidOnTime && amount > estimated) {
    throw new Error('No corresponde abonar recargo porque la fecha de pago fue a término en o antes del vencimiento.');
  }

  if (!isPaidOnTime && amount > estimated) {
    surchargeAmount = amount - estimated;
  }

  return {
    paidAmount: amount,
    surchargeAmount,
    paidAt: new Date(paymentDate).toISOString(),
    status: 'PAGADO',
    isOverduePayment: !isPaidOnTime
  };
}

export function formatMoneyNumber(val) {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function calculateInstallmentDetails(basePrice, totalInstallments, hasInterest, interestPercentage) {
  const price = Number(basePrice) || 0;
  const count = Math.max(1, Number(totalInstallments) || 1);
  const rate = hasInterest ? (Number(interestPercentage) || 0) : 0;

  const totalPrice = Math.round(price * (1 + (rate / 100)));
  const installmentAmount = Math.round(totalPrice / count);

  return {
    basePrice: price,
    totalPrice,
    installmentAmount,
    totalInstallments: count
  };
}

export function calculateCategorizedMetrics(totalBudget, expenses, currentYearMonthStr = null) {
  const budget = Number(totalBudget) || 0;
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  
  const activeExpenses = safeExpenses.filter(e => {
    if (e.dynamic_status === 'VENCIDO') return true;
    if (e.due_date && currentYearMonthStr) {
      const expYM = e.due_date.substring(0, 7);
      return expYM === currentYearMonthStr;
    }
    return true;
  });

  const fixedExpenses = activeExpenses.filter(e => e.expense_type === 'FIJO');
  const eventualExpenses = activeExpenses.filter(e => e.expense_type === 'EVENTUAL');

  const totalFixedCommitted = fixedExpenses.reduce((sum, e) => {
    const amt = e.actual_paid_amount ? Number(e.actual_paid_amount) : Number(e.estimated_amount || 0);
    return sum + amt;
  }, 0);

  const totalEventualCommitted = eventualExpenses.reduce((sum, e) => {
    const amt = e.actual_paid_amount ? Number(e.actual_paid_amount) : Number(e.estimated_amount || 0);
    return sum + amt;
  }, 0);

  const totalCommitted = totalFixedCommitted + totalEventualCommitted;

  const totalPaid = activeExpenses.reduce((sum, e) => {
    if (e.dynamic_status === 'PAGADO' || e.status === 'PAGADO') {
      return sum + Number(e.actual_paid_amount || e.estimated_amount || 0);
    }
    return sum;
  }, 0);

  const available = budget - totalCommitted;
  const percentage = budget > 0 ? Math.round((totalCommitted / budget) * 100) : 0;

  let status = 'NORMAL';
  if (percentage >= 100) status = 'EXCEDIDO';
  else if (percentage >= 80) status = 'ADVERTENCIA';

  return {
    budget,
    totalFixedCommitted,
    totalEventualCommitted,
    totalCommitted,
    totalPaid,
    available,
    percentage,
    status
  };
}

export function determineExpenseStatusAndPriority(dueDateString, isPaid, currentDate = new Date()) {
  if (isPaid) return { status: 'PAGADO', priority: 'BAJA' };
  if (!dueDateString) return { status: 'PENDIENTE', priority: 'MEDIA' };

  const parts = String(dueDateString).split('T')[0].split('-');
  if (parts.length < 3) return { status: 'PENDIENTE', priority: 'MEDIA' };

  const dueYear = parseInt(parts[0], 10);
  const dueMonth = parseInt(parts[1], 10) - 1;
  const dueDay = parseInt(parts[2], 10);

  const due = new Date(dueYear, dueMonth, dueDay);
  const curr = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

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
}

export function validateExpenseInput(title, estimatedAmount, dueDateString, existingExpenses = [], currentId = null) {
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('El concepto es obligatorio');
  } else if (isDuplicateExpenseTitle(existingExpenses, title, currentId)) {
    errors.push(`Ya existe una obligación registrada con el nombre "${title.trim()}". Utiliza un concepto distinto.`);
  }

  const amount = Number(estimatedAmount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('El monto debe ser mayor a $0');
  }

  if (!dueDateString) {
    errors.push('La fecha de vencimiento es obligatoria');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
