import pool from '../config/db.js';
import {
  calculateCategorizedMetrics,
  determineExpenseStatusAndPriority,
  validateExpenseInput,
  processPaymentData,
  formatMoneyNumber
} from '../services/expenseRules.js';

let mockCategories = [
  { id: 1, name: 'Vivienda', icon: 'home', color: '#E06D53' },
  { id: 2, name: 'Servicios', icon: 'zap', color: '#D97706' },
  { id: 3, name: 'Cuota', icon: 'credit-card', color: '#6366F1' },
  { id: 4, name: 'Entretenimiento', icon: 'tv', color: '#8B5CF6' }
];

let mockBudget = 520000;

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-12
const currentMonthFormatted = String(currentMonth).padStart(2, '0');
const currentPeriodYM = `${currentYear}-${currentMonthFormatted}`;

let mockExpenses = [
  {
    id: 1,
    title: 'Alquiler Departamento',
    category_id: 1,
    category_name: 'Vivienda',
    category_icon: 'home',
    expense_type: 'FIJO',
    estimated_amount: 280000,
    due_date: `${currentYear}-${currentMonthFormatted}-10`,
    priority: 'ALTA',
    status: 'PENDIENTE',
    actual_paid_amount: null,
    paid_at: null,
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
    due_date: `${currentYear}-${currentMonthFormatted}-25`,
    priority: 'MEDIA',
    status: 'PENDIENTE',
    actual_paid_amount: null,
    paid_at: null,
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
    due_date: `${currentYear}-${currentMonthFormatted}-05`,
    priority: 'ALTA',
    status: 'PENDIENTE',
    actual_paid_amount: null,
    paid_at: null,
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
    actual_paid_amount: null,
    paid_at: null,
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
    due_date: `${currentYear}-${currentMonthFormatted}-18`,
    priority: 'MEDIA',
    status: 'PENDIENTE',
    actual_paid_amount: null,
    paid_at: null,
    installment_current: 1,
    installment_total: 3,
    notes: 'Cuota 1 de 3 ($165.000 total)'
  }
];

export async function getDashboardData(req, res) {
  try {
    let categories = [];
    let expenses = [];
    let budget = mockBudget;

    try {
      const catRes = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      categories = catRes.rows;

      const expRes = await pool.query(`
        SELECT e.*, c.name as category_name, c.icon as category_icon
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.due_date ASC
      `);
      expenses = expRes.rows.map(exp => {
        const dueDateStr = exp.due_date instanceof Date 
          ? exp.due_date.toISOString().split('T')[0] 
          : String(exp.due_date).split('T')[0];
        return {
          ...exp,
          due_date: dueDateStr,
          estimated_amount: parseFloat(exp.estimated_amount),
          actual_paid_amount: exp.actual_paid_amount ? parseFloat(exp.actual_paid_amount) : null
        };
      });

      const budgetRes = await pool.query('SELECT total_budget FROM monthly_budgets ORDER BY id DESC LIMIT 1');
      if (budgetRes.rows.length > 0) {
        budget = parseFloat(budgetRes.rows[0].total_budget);
      }
    } catch (dbErr) {
      console.error('⚠️ ERROR POSTGRESQL (getDashboardData):', dbErr.message);
      categories = mockCategories;
      expenses = mockExpenses;
    }

    const processedExpenses = expenses.map(exp => {
      const { status: compStatus, priority: compPriority } = determineExpenseStatusAndPriority(exp.due_date, exp.status === 'PAGADO');
      return {
        ...exp,
        dynamic_status: compStatus,
        effective_priority: compPriority
      };
    });

    // Calcular métricas únicamente para el período activo (2026-08) o vencidos pasados
    const metrics = calculateCategorizedMetrics(budget, processedExpenses, currentPeriodYM);

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentPeriodName = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;

    res.json({
      currentPeriodName,
      metrics,
      categories: categories.length > 0 ? categories : mockCategories,
      expenses: processedExpenses
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos del dashboard', details: error.message });
  }
}

export async function createExpense(req, res) {
  try {
    const { title, category_id, expense_type, estimated_amount, due_date, notes, installment_current, installment_total } = req.body;

    const validation = validateExpenseInput(title, estimated_amount, due_date, mockExpenses);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    let newExpense = null;
    const typeVal = expense_type === 'EVENTUAL' ? 'EVENTUAL' : 'FIJO';
    const catObj = mockCategories.find(c => c.id === parseInt(category_id, 10)) || mockCategories[0];
    const { status: compStatus, priority: compPriority } = determineExpenseStatusAndPriority(due_date, false);

    try {
      const insertQuery = `
        INSERT INTO expenses (title, category_id, expense_type, estimated_amount, due_date, priority, notes, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [
        title.trim(),
        category_id || 1,
        typeVal,
        parseFloat(estimated_amount),
        due_date,
        compPriority,
        notes || ''
      ]);
      newExpense = result.rows[0];
    } catch (dbErr) {
      console.error('⚠️ ERROR POSTGRESQL (createExpense):', dbErr.message);
      newExpense = {
        id: Date.now(),
        title: title.trim(),
        category_id: parseInt(category_id, 10) || 1,
        category_name: catObj.name,
        category_icon: catObj.icon,
        expense_type: typeVal,
        estimated_amount: parseFloat(estimated_amount),
        due_date,
        priority: compPriority,
        status: 'PENDIENTE',
        dynamic_status: compStatus,
        effective_priority: compPriority,
        actual_paid_amount: null,
        paid_at: null,
        installment_current: installment_current ? parseInt(installment_current, 10) : null,
        installment_total: installment_total ? parseInt(installment_total, 10) : null,
        notes: notes || ''
      };
      mockExpenses.push(newExpense);
    }

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la obligación', details: error.message });
  }
}

export async function payExpense(req, res) {
  try {
    const { id } = req.params;
    const { actual_paid_amount, payment_date, note } = req.body;

    let expense = mockExpenses.find(e => e.id === parseInt(id, 10));

    try {
      const findRes = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
      if (findRes.rows.length > 0) {
        expense = findRes.rows[0];
      }
    } catch (dbErr) {
      // Usar mockExpenses
    }

    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    const { status: compStatus } = determineExpenseStatusAndPriority(expense.due_date, expense.status === 'PAGADO');
    const expenseWithStatus = { ...expense, dynamic_status: compStatus };

    const processed = processPaymentData(expenseWithStatus, actual_paid_amount, payment_date);

    try {
      await pool.query('BEGIN');
      await pool.query(`
        UPDATE expenses
        SET status = 'PAGADO', actual_paid_amount = $1, paid_at = $2
        WHERE id = $3
      `, [processed.paidAmount, processed.paidAt, id]);

      await pool.query(`
        INSERT INTO payments (expense_id, amount, payment_date, note)
        VALUES ($1, $2, $3, $4)
      `, [id, processed.paidAmount, processed.paidAt, note || 'Pago registrado']);
      await pool.query('COMMIT');
    } catch (dbErr) {
      if (expense) {
        expense.status = 'PAGADO';
        expense.actual_paid_amount = processed.paidAmount;
        expense.paid_at = processed.paidAt;
      }
    }

    res.json({
      message: 'Pago registrado exitosamente',
      paidAmount: processed.paidAmount,
      surchargeAmount: processed.surchargeAmount,
      isOverduePayment: processed.isOverduePayment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;

    try {
      await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    } catch (dbErr) {
      mockExpenses = mockExpenses.filter(e => e.id !== parseInt(id, 10));
    }

    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el gasto' });
  }
}

export async function updateBudget(req, res) {
  try {
    const { total_budget } = req.body;
    const amount = parseFloat(total_budget);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'El presupuesto debe ser un número mayor a $0' });
    }

    mockBudget = amount;

    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      await pool.query(`
        INSERT INTO monthly_budgets (year, month, total_budget)
        VALUES ($1, $2, $3)
        ON CONFLICT (year, month) DO UPDATE SET total_budget = EXCLUDED.total_budget
      `, [year, month, amount]);
    } catch (dbErr) {
      // Usar mockBudget
    }

    res.json({ message: 'Presupuesto actualizado correctamente', total_budget: amount });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el presupuesto' });
  }
}
