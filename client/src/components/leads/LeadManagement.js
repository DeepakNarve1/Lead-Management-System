import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useLeads } from "../../contexts/LeadContext";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 10;

const LeadManagement = () => {
  const { refreshLeads } = useLeads();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    state: "",
    source: "website",
    status: "new",
    score: "",
    lead_value: "",
    is_qualified: false,
  });

  const [gridApi, setGridApi] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        if (debouncedSearch || status !== "all") setSearchLoading(true);
        else setLoading(true);

        const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
        if (debouncedSearch?.trim())
          params.append("search", debouncedSearch.trim());
        if (status !== "all") params.append("status", status);

        const res = await axios.get(`/leads?${params.toString()}`);

        const rows = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.leads || res.data?.items || [];
        const totalFromRes =
          res.data?.total ??
          res.data?.totalCount ??
          res.data?.meta?.total ??
          rows.length;
        const totalPagesFromRes =
          res.data?.totalPages ?? res.data?.meta?.totalPages;

        setLeads(rows);
        setTotal(totalFromRes ?? rows.length ?? 0);
        setTotalPages(
          totalPagesFromRes ??
            Math.max(
              1,
              Math.ceil((totalFromRes ?? rows.length ?? 0) / ITEMS_PER_PAGE)
            )
        );
      } catch (err) {
        console.error(err);
        setLeads([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status]);

  const gridOptions = useMemo(
    () => ({
      defaultColDef: {
        sortable: false,
        resizable: true,
        minWidth: 100,
        suppressMenu: true, // hide header menu including sort
        cellStyle: {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          paddingLeft: 12,
          paddingRight: 12,
        },
      },
      domLayout: "autoHeight",
      suppressRowClickSelection: true,
      rowSelection: "single",
      suppressHorizontalScroll: true,
      enableBrowserTooltips: true,
    }),
    []
  );

  const fmtCurr = (v) =>
    v != null && v !== ""
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(v))
      : "-";

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Lead",
        valueGetter: (p) =>
          `${p.data?.first_name || ""} ${p.data?.last_name || ""}`.trim(),
        flex: 2,
        minWidth: 220,
        cellRenderer: (p) => {
          const d = p.data || {};
          return (
            <div>
              <div
                className="font-medium text-gray-900 truncate"
                title={`${d.first_name || ""} ${d.last_name || ""}`}
              >
                {`${d.first_name || ""} ${d.last_name || ""}`}
              </div>
              <div
                className="text-sm text-gray-500 truncate"
                title={d.email || ""}
                style={{ fontSize: "0.85rem" }}
              >
                {d.email || "-"}
              </div>
              {d.phone && (
                <div
                  className="text-sm text-gray-500 truncate"
                  title={d.phone}
                  style={{ fontSize: "0.85rem" }}
                >
                  {d.phone}
                </div>
              )}
            </div>
          );
        },
      },
      {
        headerName: "Company",
        field: "company",
        minWidth: 140,
        flex: 1,
        cellRenderer: (p) => (
          <div title={p.value || "-"} className="truncate">
            {p.value || "-"}
          </div>
        ),
      },
      {
        headerName: "Location",
        valueGetter: (p) => {
          const d = p.data || {};
          return d.city && d.state
            ? `${d.city}, ${d.state}`
            : d.city || d.state || "-";
        },
        minWidth: 140,
        flex: 1,
        cellRenderer: (p) => (
          <div title={p.value} className="truncate">
            {p.value}
          </div>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 120,
        flex: 0.9,
        cellRenderer: (p) => {
          const s = p.value || "-";
          const colors = {
            new: "bg-blue-100 text-blue-800",
            contacted: "bg-yellow-100 text-yellow-800",
            qualified: "bg-green-100 text-green-800",
            won: "bg-purple-100 text-purple-800",
            lost: "bg-red-100 text-red-800",
          };
          return (
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                colors[s] || "bg-gray-100 text-gray-800"
              }`}
              title={s}
              style={{ whiteSpace: "nowrap" }}
            >
              {s}
            </span>
          );
        },
      },
      {
        headerName: "Score",
        field: "score",
        minWidth: 64,
        flex: 0.4,
        cellRenderer: (p) => (
          <div className="truncate text-center">{p.value ?? "-"}</div>
        ),
      },
      {
        headerName: "Value",
        field: "lead_value",
        minWidth: 120,
        flex: 1,
        valueFormatter: (p) => fmtCurr(p.value),
        cellRenderer: (p) => (
          <div
            title={p.value != null ? p.value.toString() : "-"}
            className="truncate"
          >
            {fmtCurr(p.value)}
          </div>
        ),
      },
      {
        headerName: "Source",
        field: "source",
        minWidth: 120,
        flex: 1,
        cellRenderer: (p) => (
          <div title={p.value || "-"} className="truncate">
            {p.value || "-"}
          </div>
        ),
      },
      {
        headerName: "Qualified",
        field: "is_qualified",
        minWidth: 64,
        flex: 0.35,
        cellRenderer: (p) => (
          <div title={p.value ? "Yes" : "No"} className="truncate text-center">
            {p.value ? "✓" : "✗"}
          </div>
        ),
      },
      {
        headerName: "Created",
        field: "createdAt",
        minWidth: 120,
        flex: 1,
        valueFormatter: (p) =>
          p.value ? new Date(p.value).toLocaleDateString() : "-",
      },
      {
        headerName: "Actions",
        minWidth: 140,
        flex: 0.9,
        cellRenderer: (p) => (
          <div className="flex space-x-2">
            <button
              className="text-blue-600 hover:text-blue-900"
              onClick={() => onEdit(p.data)}
            >
              Edit
            </button>
            <button
              className="text-red-600 hover:text-red-900"
              onClick={() => onDelete(p.data.id)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!gridApi) return;
    setTimeout(() => {
      try {
        gridApi.sizeColumnsToFit();
      } catch {}
    }, 0);

    const onResize = () => {
      try {
        gridApi.sizeColumnsToFit();
      } catch {}
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [gridApi, leads]);

  const onEdit = (lead) => {
    setEditing(lead);
    setForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      city: lead.city || "",
      state: lead.state || "",
      source: lead.source || "website",
      status: lead.status || "new",
      score: lead.score ?? "",
      lead_value: lead.lead_value ?? "",
      is_qualified: lead.is_qualified || false,
    });
    setShowModal(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await axios.delete(`/leads/${id}`);
      refreshLeads();
      if (leads.length === 1 && page > 1) setPage((p) => p - 1);
      else setTimeout(fetchLeads, 0);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  async function fetchLeads() {
    try {
      const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
      if (debouncedSearch?.trim())
        params.append("search", debouncedSearch.trim());
      if (status !== "all") params.append("status", status);
      const res = await axios.get(`/leads?${params.toString()}`);
      const rows = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.leads || res.data?.items || [];
      const totalFromRes =
        res.data?.total ??
        res.data?.totalCount ??
        res.data?.meta?.total ??
        rows.length;
      const totalPagesFromRes =
        res.data?.totalPages ?? res.data?.meta?.totalPages;
      setLeads(rows);
      setTotal(totalFromRes ?? rows.length ?? 0);
      setTotalPages(
        totalPagesFromRes ??
          Math.max(
            1,
            Math.ceil((totalFromRes ?? rows.length ?? 0) / ITEMS_PER_PAGE)
          )
      );
    } catch (err) {
      console.error(err);
      setLeads([]);
      setTotal(0);
      setTotalPages(1);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        score: form.score ? Number(form.score) : null,
        lead_value: form.lead_value ? Number(form.lead_value) : null,
        is_qualified: Boolean(form.is_qualified),
      };
      if (editing) await axios.put(`/leads/${editing.id}`, payload);
      else await axios.post("/leads", payload);
      refreshLeads();
      fetchLeads();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      city: "",
      state: "",
      source: "website",
      status: "new",
      score: "",
      lead_value: "",
      is_qualified: false,
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  const startIndex = total === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(total, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-1">Manage and track your leads</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" /> Add New Lead
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads (server-side)..."
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
              <option value="won">Won</option>
            </select>
            {(search || status !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setStatus("all");
                  setPage(1);
                }}
                className="px-3 py-2 text-sm border rounded-md"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {(debouncedSearch || status !== "all") && (
          <div className="mt-4 flex flex-wrap gap-2">
            {debouncedSearch && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: {debouncedSearch}{" "}
                <button
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className="ml-2"
                >
                  ×
                </button>
              </span>
            )}
            {status !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Status: {status}{" "}
                <button
                  onClick={() => {
                    setStatus("all");
                    setPage(1);
                  }}
                  className="ml-2"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Leads loaded: {leads.length}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div
          className="ag-theme-alpine w-full overflow-x-hidden"
          style={{ width: "100%" }}
        >
          <AgGridReact
            rowData={leads}
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            rowHeight={48}
            headerHeight={56}
            onGridReady={(params) => {
              setGridApi(params.api);
              try {
                params.api.sizeColumnsToFit();
              } catch {}
            }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
          <div className="text-sm text-gray-600">
            Showing {startIndex} - {endIndex} of {total}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => page > 1 && setPage((p) => p - 1)}
              disabled={page <= 1}
              className={`px-3 py-1 rounded-md border ${
                page <= 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              ◀
            </button>
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => page < totalPages && setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className={`px-3 py-1 rounded-md border ${
                page >= totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="w-96 bg-white rounded-md shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editing ? "Edit Lead" : "Add New Lead"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                {
                  name: "first_name",
                  label: "First Name *",
                  type: "text",
                  required: true,
                },
                {
                  name: "last_name",
                  label: "Last Name *",
                  type: "text",
                  required: true,
                },
                {
                  name: "email",
                  label: "Email *",
                  type: "email",
                  required: true,
                },
                { name: "phone", label: "Phone", type: "tel" },
                { name: "company", label: "Company", type: "text" },
                { name: "city", label: "City", type: "text" },
                { name: "state", label: "State", type: "text" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700">
                    {f.label}
                  </label>
                  <input
                    required={f.required}
                    type={f.type}
                    value={form[f.name]}
                    onChange={(e) =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Source *
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                >
                  <option value="website">Website</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="referral">Referral</option>
                  <option value="events">Events</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="lost">Lost</option>
                  <option value="won">Won</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lead Value ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.lead_value}
                  onChange={(e) =>
                    setForm({ ...form, lead_value: e.target.value })
                  }
                  className="mt-1 w-full border rounded-md px-3 py-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_qualified"
                  type="checkbox"
                  checked={form.is_qualified}
                  onChange={(e) =>
                    setForm({ ...form, is_qualified: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label
                  htmlFor="is_qualified"
                  className="ml-2 text-sm text-gray-700"
                >
                  Qualified Lead
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  {editing ? "Update Lead" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
