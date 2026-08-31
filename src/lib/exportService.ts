/**
 * COROT HEALTHCARE HOSPICARE - EXPORT UTILITY (CSV & Data Streams)
 */

export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(header => {
        let val = row[header];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        const stringVal = String(val ?? '').replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
