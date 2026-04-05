export function formatCurrency(amount, currencySymbol = '$') {
  if (amount === null || amount === undefined) return '—'
  return `${currencySymbol}${Number(amount).toFixed(2)}`
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDatetime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatMonthYear(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  })
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export function nowISODatetime() {
  return new Date().toISOString()
}
