/**
 * Módulo de Reglas de Negocio de FinFix (Versión con Cálculo de Interés Total en Cuotas y Período Filtrado)
 */

export function isDuplicateExpenseTitle(existingExpenses, newTitle, currentExpenseId = null) {
  if (!newTitle || typeof newTitle !== 'string') return false;
  const cleanTitle = newTitle.trim().toLowerCase();
  
  return (existingExpenses || []).some(exp => 
    exp.id !== currentExpenseId && 
    exp.title && exp.title.trim().toLowerCase() === cleanTitle
  );
}

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

  const isOverdue = expense.dynamic_status === 'VENCIDO';
  let surchargeAmount = 0;

  if (!isOverdue && amount > estimated) {
    throw new Error('No corresponde abonar recargo porque el gasto está al día. Debe abonarse el monto exacto.');
  }

  if (isOverdue && amount > estimated) {
    surchargeAmount = amount - estimated;
  }

  const date = paymentDate ? new Date(paymentDate) : new Date();

  return {
    paidAmount: amount,
    surchargeAmount,
    paidAt: date.toISOString(),
    status: 'PAGADO',
    isOverduePayment: isOverdue
  };
}

/**
 * Formateador de dinero con punto para miles (5.000, 50.000, 150.000)
 */
export function formatMoneyNumber(val) {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Cálculo de Cuotas con Interés sobre el Precio Total:
 * Precio Final = Precio Base * (1 + %Interes / 100)
 * Cuota Valor = Precio Final / Cantidad Cuotas
 */
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

/**
 * Regla 3: Calcula métricas filtrando únicamente el período activo (mes corriente o vencidos anteriores).
 * Los gastos del próximo mes NO computan en el comprometido ni saldo libre del mes actual.
 */
export function calculateCategorizedMetrics(totalBudget, expenses, currentYearMonthStr = null) {
  const budget = Number(totalBudget) || 0;
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  
  // Filtrar para métricas del mes corriente
  const activeExpenses = safeExpenses.filter(e => {
    if (!currentYearMonthStr) return true;
    if (e.dynamic_status === 'VENCIDO') return true; // Vencidos cuentan en el mes actual hasta liquidar
    
    if (e.due_date) {
      const expYM = e.due_date.substring(0, 7); // "YYYY-MM"
      return expYM <= currentYearMonthStr;
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
