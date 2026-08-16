const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  if (!response.ok) {
    throw new Error('Error al obtener datos del servidor');
  }
  return response.json();
}

export async function createExpense(expenseData) {
  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors ? data.errors.join(', ') : data.error);
  }
  return data;
}

export async function payExpense(id, paymentData) {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al procesar el pago');
  }
  return data;
}

export async function deleteExpense(id) {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Error al eliminar el gasto');
  }
  return response.json();
}

export async function updateBudget(totalBudget) {
  const response = await fetch(`${API_BASE_URL}/budget`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_budget: totalBudget })
  });
  if (!response.ok) {
    throw new Error('Error al actualizar el presupuesto');
  }
  return response.json();
}
