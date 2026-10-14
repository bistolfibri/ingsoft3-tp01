import pool from '../config/db.js';
import {
  calculateCategorizedMetrics,
  determineExpenseStatusAndPriority,
  validateExpenseInput,
  processPaymentData
} from '../services/expenseRules.js';

// Presupuesto por defecto SOLO si la tabla monthly_budgets está vacía.
const DEFAULT_BUDGET = 950000;

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Fuente única de verdad: PostgreSQL.
 * Si la base falla, respondemos error HTTP (500) en lugar de inventar datos:
 * así los tests de integración y los healthchecks detectan el problema.
 */
export async function getDashboardData(req, res) {
  try {
    const now = new Date();
    const currentPeriodYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const catRes = await pool.query('SELECT * FROM categories ORDER BY id ASC');

    const expRes = await pool.query(`
      SELECT e.*, c.name AS category_name, c.icon AS category_icon
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.due_date ASC
    `);

    const budgetRes = await pool.query('SELECT total_budget FROM monthly_budgets ORDER BY id DESC LIMIT 1');
    const budget = budgetRes.rows.length > 0 ? parseFloat(budgetRes.rows[0].total_budget) : DEFAULT_BUDGET;

    const processedExpenses = expRes.rows.map(exp => {
      const dueDateStr = exp.due_date instanceof Date
        ? exp.due_date.toISOString().split('T')[0]
        : String(exp.due_date).split('T')[0];
      const { status: dynamicStatus, priority: effectivePriority } =
        determineExpenseStatusAndPriority(dueDateStr, exp.status === 'PAGADO');
      return {
        ...exp,
        due_date: dueDateStr,
        estimated_amount: parseFloat(exp.estimated_amount),
        actual_paid_amount: exp.actual_paid_amount ? parseFloat(exp.actual_paid_amount) : null,
        dynamic_status: dynamicStatus,
        effective_priority: effectivePriority
      };
    });

    const metrics = calculateCategorizedMetrics(budget, processedExpenses, currentPeriodYM);

    res.json({
      currentPeriodName: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      metrics,
      categories: catRes.rows,
      expenses: processedExpenses
    });
  } catch (error) {
    console.error('ERROR POSTGRESQL (getDashboardData):', error.message);
    res.status(500).json({ error: 'Error al obtener datos del dashboard', details: error.message });
  }
}

export async function createExpense(req, res) {
  try {
    const { title, category_id, expense_type, estimated_amount, due_date, notes } = req.body;

    // La validación de títulos duplicados se hace contra lo que hay REALMENTE en la base.
    const existing = await pool.query('SELECT id, title FROM expenses');
    const validation = validateExpenseInput(title, estimated_amount, due_date, existing.rows);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const typeVal = expense_type === 'EVENTUAL' ? 'EVENTUAL' : 'FIJO';
    const { priority } = determineExpenseStatusAndPriority(due_date, false);

    const result = await pool.query(
      `INSERT INTO expenses (title, category_id, expense_type, estimated_amount, due_date, priority, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')
       RETURNING *`,
      [title.trim(), category_id || 1, typeVal, parseFloat(estimated_amount), due_date, priority, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // 23503 = violación de clave foránea (category_id que no existe)
    if (error.code === '23503') {
      return res.status(400).json({ errors: ['La categoría indicada no existe'] });
    }
    console.error('ERROR POSTGRESQL (createExpense):', error.message);
    res.status(500).json({ error: 'Error al crear la obligación', details: error.message });
  }
}

export async function payExpense(req, res) {
  const { id } = req.params;
  const { actual_paid_amount, payment_date, note } = req.body;

  let client;
  try {
    const findRes = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    const expense = findRes.rows[0];

    const { status: dynamicStatus } = determineExpenseStatusAndPriority(expense.due_date, expense.status === 'PAGADO');

    let processed;
    try {
      processed = processPaymentData({ ...expense, dynamic_status: dynamicStatus }, actual_paid_amount, payment_date);
    } catch (ruleErr) {
      return res.status(400).json({ error: ruleErr.message });
    }

    // Transacción: se usa UN cliente del pool para que BEGIN/COMMIT afecten a la misma conexión.
    client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE expenses SET status = 'PAGADO', actual_paid_amount = $1, paid_at = $2 WHERE id = $3`,
        [processed.paidAmount, processed.paidAt, id]
      );
      await client.query(
        `INSERT INTO payments (expense_id, amount, payment_date, note) VALUES ($1, $2, $3, $4)`,
        [id, processed.paidAmount, processed.paidAt, note || 'Pago registrado']
      );
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }

    res.json({
      message: 'Pago registrado exitosamente',
      paidAmount: processed.paidAmount,
      surchargeAmount: processed.surchargeAmount,
      isOverduePayment: processed.isOverduePayment
    });
  } catch (error) {
    console.error('ERROR POSTGRESQL (payExpense):', error.message);
    res.status(500).json({ error: 'Error al registrar el pago', details: error.message });
  } finally {
    if (client) client.release();
  }
}

export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    res.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    console.error('ERROR POSTGRESQL (deleteExpense):', error.message);
    res.status(500).json({ error: 'Error al eliminar el gasto' });
  }
}

export async function updateBudget(req, res) {
  try {
    const amount = parseFloat(req.body.total_budget);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'El presupuesto debe ser un número mayor a $0' });
    }

    const now = new Date();
    await pool.query(
      `INSERT INTO monthly_budgets (year, month, total_budget)
       VALUES ($1, $2, $3)
       ON CONFLICT (year, month) DO UPDATE SET total_budget = EXCLUDED.total_budget`,
      [now.getFullYear(), now.getMonth() + 1, amount]
    );

    res.json({ message: 'Presupuesto actualizado correctamente', total_budget: amount });
  } catch (error) {
    console.error('ERROR POSTGRESQL (updateBudget):', error.message);
    res.status(500).json({ error: 'Error al actualizar el presupuesto' });
  }
}
