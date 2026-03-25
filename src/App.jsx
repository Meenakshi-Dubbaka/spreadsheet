import { useEffect, useState } from "react";
import "./App.css";
const ROWS = 20;
const COLS = 10;

const getCellId = (r, c) => `${String.fromCharCode(65 + c)}${r}`;

const parseFormula = (formula, cells) => {
  try {
    const expr = formula.slice(1).replace(/[A-Za-z][0-9]+/g, (match) => {
      const key = match.toUpperCase();
      return cells[key]?.value || 0;
    });

    if (/[^0-9+\-*/(). ]/.test(expr)) return null;

    return eval(expr);
  } catch {
    return null;
  }
};

const smartCompare = (A, B, order) => {
  const a = isNaN(A) ? A : Number(A);
  const b = isNaN(B) ? B : Number(B);

  if (typeof a === "number" && typeof b === "number") {
    return order === "asc" ? a - b : b - a;
  }

  return order === "asc"
    ? String(a).localeCompare(String(b))
    : String(b).localeCompare(String(a));
};

export default function App() {
  const [cells, setCells] = useState({});
  const [selected, setSelected] = useState(null);
  const [_undoStack, setUndoStack] = useState([]);

  const [sortConfig, setSortConfig] = useState({});
  const [rowOrder, setRowOrder] = useState(
    [...Array(ROWS)].map((_, i) => i + 1),
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sheet"));

      if (saved) {
        setCells(saved.cells ?? {});
        setRowOrder(saved.rowOrder ?? [...Array(ROWS)].map((_, i) => i + 1));
      }
    } catch {
      localStorage.removeItem("sheet");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("sheet", JSON.stringify({ cells, rowOrder }));
    }, 500);
    return () => clearTimeout(t);
  }, [cells, rowOrder]);

  const handleChange = (id, value) => {
    setUndoStack((prev) => [...prev, cells]);

    setCells((prev) => {
      let newValue = value;

      if (value.startsWith("=")) {
        const result = parseFormula(value, prev);

        if (result !== null) {
          newValue = result;
        } else {
          newValue = "";
        }
      }

      return {
        ...prev,
        [id]: {
          value: newValue,
          formula: value.startsWith("=") ? value : null,
        },
      };
    });
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const text = e.clipboardData.getData("text").trim();
    const rows = text.split("\n").map((r) => r.split("\t"));

    const startRow = selected?.row || 1;
    const startCol = selected?.col || 0;

    setUndoStack((prev) => [...prev, cells]);

    setCells((prev) => {
      let updated = { ...prev };

      rows.forEach((r, i) => {
        r.forEach((val, j) => {
          const id = getCellId(startRow + i, startCol + j);
          updated[id] = { value: val, formula: null };
        });
      });

      return updated;
    });
  };

  const handleCopy = async () => {
    if (!selected) return;
    const id = getCellId(selected.row, selected.col);
    await navigator.clipboard.writeText(cells[id]?.value || "");
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;

      const newStack = [...prev];
      const last = newStack.pop();

      setCells(last);
      return newStack;
    });
  };

  const sortColumn = (col) => {
    const current = sortConfig[col] || "none";
    const next =
      current === "none" ? "asc" : current === "asc" ? "desc" : "none";

    setSortConfig({ [col]: next });

    if (next === "none") {
      setRowOrder([...Array(ROWS)].map((_, i) => i + 1));
      return;
    }

    const sorted = [...rowOrder].sort((a, b) => {
      const A = cells[getCellId(a, col)]?.value || "";
      const B = cells[getCellId(b, col)]?.value || "";
      return smartCompare(A, B, next);
    });

    setRowOrder(sorted);
  };

  return (
    <div onPaste={handlePaste}>
      <button onClick={undo}>Undo</button>
      <button onClick={handleCopy}>Copy</button>

      <table>
        <thead>
          <tr>
            <th></th>
            {[...Array(COLS)].map((_, c) => (
              <th key={c} onClick={() => sortColumn(c)}>
                {String.fromCharCode(65 + c)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowOrder.map((r) => (
            <tr key={r}>
              <td>{r}</td>

              {[...Array(COLS)].map((_, c) => {
                const id = getCellId(r, c);

                return (
                  <td
                    key={c}
                    style={{
                      background:
                        selected?.row === r && selected?.col === c
                          ? "#1e40af"
                          : "transparent",
                    }}
                  >
                    <input
                      value={cells[id]?.formula || cells[id]?.value || ""}
                      onFocus={() => setSelected({ row: r, col: c })}
                      onChange={(e) => handleChange(id, e.target.value)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
