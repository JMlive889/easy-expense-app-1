export function exportToCsv(
  data: any[],
  filename = "data.csv",
  headers?: string[]
) {
  if (data.length === 0) return;

  const headerKeys = headers || Object.keys(data[0]);
  const headerRow = headerKeys.join(",");

  const rows = data.map((row) =>
    headerKeys
      .map((key) => {
        const val = row[key];
        if (val == null) return "";
        const str = String(val).replace(/"/g, '""');
        return /[,"\n]/.test(str) ? `"${str}"` : str;
      })
      .join(",")
  );

  const csvContent = [headerRow, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
