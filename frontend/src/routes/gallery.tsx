import { createFileRoute } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

import { Search, Video, Image } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  component: RouteComponent,
});

type Media = {
  id: number;
  source_url: string;
  media_url: string;
  media_type: string;
  file_name: string;
  alt_text: string;
  created_at: Date;
  errors: string | null;
};

const columnHelper = createColumnHelper<Media>();

const columns = [
  columnHelper.accessor("id", {
    header: "id",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("source_url", {
    header: "Source",
    cell: (info) => info.getValue(),
  }),

  // columnHelper.accessor("media_url", {
  //   header: "Media URL",
  //   cell: (info) => info.getValue(),
  // }),

  // columnHelper.accessor("media_type", {
  //   header: "Type",
  //   cell: (info) => (
  //     <div className="flex items-center gap-2">
  //       <span className="capitalize">{info.getValue()}</span>
  //     </div>
  //   ),
  // }),

  // columnHelper.accessor("file_name", {
  //   header: "File name",
  //   cell: (info) => (
  //     <span className="font-mono text-sm">{info.getValue()}</span>
  //   ),
  // }),

  columnHelper.accessor("media_url", {
    header: "Preview",
    cell: ({ row }) => {
      const type = row.original.media_type;
      const mediaUrl = row.original.media_url;

      if (type === "image") {
        return (
          <div className="flex items-center justify-center w-40 h-24">
            <img
              src={mediaUrl}
              className="max-w-full max-h-full object-contain"
              alt={row.original.alt_text}
            />
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center w-40 h-24">
          <video
            controls
            src={mediaUrl}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    },
  }),

  // columnHelper.accessor("alt_text", {
  //   header: "Alt text",
  //   cell: (info) => <span className="text-gray-700">{info.getValue()}</span>,
  // }),

  columnHelper.accessor("errors", {
    header: "Status",
    cell: (info) => {
      const errors = info.getValue();
      return errors ? (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
          Error
        </span>
      ) : (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
          OK
        </span>
      );
    },
  }),
];

function RouteComponent() {
  const [data, setData] = useState<Media[]>(() => []);
  const [searchText, setSearchText] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);

      const params = new URLSearchParams();
      if (mediaTypeFilter !== "all") {
        params.append("media_type", mediaTypeFilter);
      }
      const response = await axios.get(
        `http://localhost:3001/api/media?${params.toString()}`,
      );

      setData(response.data);
      setLoading(false);
    };

    fetchMedia();
  }, [mediaTypeFilter]);

  const handleMediaTypeChange = (type: string) => {
    setMediaTypeFilter(type);
    // Reset to first page when filter changes
    table.setPageIndex(0);
  };

  // Client-side search filter on alt_text
  const filteredData = useMemo(() => {
    if (!searchText) return data;

    return data.filter((item) =>
      item.alt_text.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [data, searchText]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return null;
  }

  return (
    <div className="text-left flex flex-col">
      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white p-4 mb-4 border-b border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search alt text..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Media Type Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => handleMediaTypeChange("all")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              mediaTypeFilter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleMediaTypeChange("image")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
              mediaTypeFilter === "image"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Image className="w-4 h-4" />
            Images
          </button>
          <button
            onClick={() => handleMediaTypeChange("video")}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
              mediaTypeFilter === "video"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Video className="w-4 h-4" />
            Videos
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-100">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border border-gray-300 p-2 text-left font-semibold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-300 hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border border-gray-300 p-2 align-middle"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-4" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount().toLocaleString()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
