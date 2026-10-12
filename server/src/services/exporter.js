import ExcelJS from "exceljs";

/*
  Real CSV + real XLSX. Both are generated from the same
  { header, key } column definitions so they never drift apart.
*/

const cellToText = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
};

const escapeCsv = (value) => {
  const text = cellToText(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

export const toCsv = (columns, rows) => {
  const lines = [columns.map((column) => escapeCsv(column.header)).join(",")];

  rows.forEach((row) => {
    lines.push(
      columns.map((column) => escapeCsv(row[column.key])).join(",")
    );
  });

  /* BOM keeps Excel happy with non-ASCII names. */
  return `\uFEFF${lines.join("\r\n")}`;
};

export const toXlsx = async (columns, rows, sheetName = "Export") => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "GEARS Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 30));

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width || 22,
  }));

  rows.forEach((row) => {
    sheet.addRow(
      Object.fromEntries(
        columns.map((column) => [column.key, cellToText(row[column.key])])
      )
    );
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111111" },
  };
  headerRow.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  return workbook.xlsx.writeBuffer();
};

const fileName = (base, extension) =>
  `${base}-${new Date().toISOString().slice(0, 10)}.${extension}`;

/* Writes the response with the right headers for a browser download. */
export const sendExport = async (res, format, columns, rows, base) => {
  if (format === "xlsx") {
    const buffer = await toXlsx(columns, rows, base);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName(base, "xlsx")}"`
    );

    res.send(Buffer.from(buffer));
    return;
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName(base, "csv")}"`
  );

  res.send(toCsv(columns, rows));
};
