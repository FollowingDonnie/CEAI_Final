export function parseCsv(text) {
  if (typeof text !== "string") throw new TypeError("CSV input must be text");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("Malformed CSV: unclosed quoted field");
  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  if (!headers.includes("record_type")) throw new Error("Registry CSV is missing record_type");
  return rows.slice(1).map((values, rowIndex) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()]));
    record.__row = rowIndex + 2;
    return record;
  });
}
