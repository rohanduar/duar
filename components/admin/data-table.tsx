import { Database } from "lucide-react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
  mobileCardRender?: (row: T, index: number) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  emptyText,
  mobileCardRender,
}: DataTableProps<T>) {
  const emptyMessage = emptyText || "No data available";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Database className="h-5 w-5" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              {mobileCardRender ? mobileCardRender(row, index) : null}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-sm font-semibold uppercase tracking-[0.06em] ${
                    String(column.key).toLowerCase() === "actions"
                      ? "text-right"
                      : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Database className="h-5 w-5" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 ${
                        String(column.key).toLowerCase() === "actions"
                          ? "text-right"
                          : ""
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
