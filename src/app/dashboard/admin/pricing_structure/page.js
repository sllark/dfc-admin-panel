"use client";

import React, { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/app/lib/authGuard";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import Layout from "@/app/components/common/layout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import LoadingButton from "@/app/components/ui/LoadingButton";
import DetailsModal from "@/app/components/ui/DetailsModal";
import { ensureMinDuration } from "@/app/lib/loadingUtils";
import { FiEdit, FiPlus, FiTrash2, FiX, FiCheck, FiMinus } from "react-icons/fi";

const CATEGORY_OPTIONS = [
  { value: "DRUG", label: "DRUG" },
  { value: "SVT", label: "SVT" },
];

const normalizeNumber = (v) => {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const sortByDisplayOrderThenName = (a, b) => {
  const ao = a?.displayOrder;
  const bo = b?.displayOrder;
  const aHas = typeof ao === "number";
  const bHas = typeof bo === "number";
  if (aHas && bHas && ao !== bo) return ao - bo;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  const an = String(a?.name ?? "").toLowerCase();
  const bn = String(b?.name ?? "").toLowerCase();
  return an.localeCompare(bn);
};

const resolveAxiosUrl = (axiosInstance, maybeRelativeUrl) => {
  try {
    const base = axiosInstance?.defaults?.baseURL;
    if (!base) return maybeRelativeUrl;
    return new URL(maybeRelativeUrl, base).toString();
  } catch {
    return maybeRelativeUrl;
  }
};

const normalizeComparisonGridToCells = (rawGrid) => {
  // Supports:
  // 1) Flat cells: [{ panelId, testItemId, included }]
  // 2) Nested rows: [{ panelId, testItems: [{ testItemId, included }] }]
  if (!Array.isArray(rawGrid)) return [];
  if (rawGrid.length === 0) return [];

  const first = rawGrid[0];
  const looksNested = first && typeof first === "object" && Array.isArray(first.testItems);
  if (!looksNested) return rawGrid;

  const cells = [];
  for (const row of rawGrid) {
    const panelId = row?.panelId ?? row?.panel_id ?? row?.panelID ?? row?.panel;
    if (panelId == null) continue;
    const items = Array.isArray(row?.testItems) ? row.testItems : [];
    for (const ti of items) {
      const testItemId =
        ti?.testItemId ?? ti?.test_item_id ?? ti?.testItemID ?? ti?.test_item ?? ti?.testItem;
      if (testItemId == null) continue;
      cells.push({
        panelId,
        testItemId,
        included: !!ti?.included,
      });
    }
  }
  return cells;
};

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-2xl border border-gray-700 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-cyan-300">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
            aria-label="Close"
          >
            <FiX size={22} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function PricingStructure() {
  const [editPricing, setEditPricing] = useState(false);
  const [activeTab, setActiveTab] = useState("PANELS"); // PANELS | TEST_ITEMS | PREVIEW

  const [panels, setPanels] = useState([]);
  const [testItems, setTestItems] = useState([]);
  const [grid, setGrid] = useState([]); // array of { panelId, testItemId, included }
  // Keep user edits stable across refresh even if backend response is stale momentarily.
  // Map key: `${panelId}::${testItemId}` -> boolean included
  const GRID_OVERRIDES_STORAGE_KEY = "dfc.pricing.gridOverrides";
  const [gridOverrides, setGridOverrides] = useState(() => {
    if (typeof window === "undefined") return new Map();
    try {
      const raw = window.localStorage.getItem(GRID_OVERRIDES_STORAGE_KEY);
      if (!raw) return new Map();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Map();
      const map = new Map();
      for (const entry of parsed) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const [k, v] = entry;
        if (typeof k !== "string") continue;
        map.set(k, !!v);
      }
      return map;
    } catch {
      return new Map();
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);
  const [panelForm, setPanelForm] = useState({
    name: "",
    displayOrder: "",
    accountNo: "",
    panelTestCode: "",
    priceCents: "",
  });
  const [selectedPanel, setSelectedPanel] = useState(null);

  const [testItemModalOpen, setTestItemModalOpen] = useState(false);
  const [editingTestItem, setEditingTestItem] = useState(null);
  const [testItemForm, setTestItemForm] = useState({
    name: "",
    category: "DRUG",
    displayOrder: "",
  });
  const [selectedTestItem, setSelectedTestItem] = useState(null);

  const sortedPanels = useMemo(() => {
    return [...(panels || [])].sort(sortByDisplayOrderThenName);
  }, [panels]);

  const sortedTestItems = useMemo(() => {
    const list = [...(testItems || [])].sort(sortByDisplayOrderThenName);
    // Keep categories grouped (DRUG first, then SVT), while respecting displayOrder.
    return list.sort((a, b) => {
      const ac = String(a?.category ?? "").toUpperCase();
      const bc = String(b?.category ?? "").toUpperCase();
      if (ac !== bc) return ac === "DRUG" ? -1 : 1;
      return sortByDisplayOrderThenName(a, b);
    });
  }, [testItems]);

  const gridKey = (panelId, testItemId) => `${panelId}::${testItemId}`;
  const cellPanelId = (cell) => cell?.panelId ?? cell?.panel_id ?? cell?.panel ?? cell?.panelID;
  const cellTestItemId = (cell) =>
    cell?.testItemId ?? cell?.test_item_id ?? cell?.testItem ?? cell?.test_item ?? cell?.testItemID;

  const includedMap = useMemo(() => {
    const map = new Map();
    for (const cell of grid || []) {
      if (!cell) continue;
      const pId = cellPanelId(cell);
      const tId = cellTestItemId(cell);
      if (pId == null || tId == null) continue;
      map.set(gridKey(pId, tId), !!cell.included);
    }
    // Apply overrides on top so refresh can't "flip back".
    for (const [k, v] of gridOverrides.entries()) {
      map.set(k, !!v);
    }
    return map;
  }, [grid, gridOverrides]);

  const loadAll = async () => {
    const startedAt = Date.now();
    try {
      setLoading(true);
      const baseURL = axios?.defaults?.baseURL;
      console.log("[PricingStructure] loadAll: baseURL =", baseURL);
      console.log("[PricingStructure] loadAll: GET(full)", {
        panels: resolveAxiosUrl(axios, "/panels"),
        testItems: resolveAxiosUrl(axios, "/test-items"),
        comparison: resolveAxiosUrl(axios, "/panel-comparison/view"),
      });
      const [panelsRes, testItemsRes, comparisonRes] = await Promise.all([
        axios.get("/panels"),
        axios.get("/test-items"),
        axios.get("/panel-comparison/view"),
      ]);
      console.log("[PricingStructure] GET result:", {
        panels: {
          url: resolveAxiosUrl(axios, panelsRes?.config?.url),
          status: panelsRes?.status,
          data: panelsRes?.data,
        },
        testItems: {
          url: resolveAxiosUrl(axios, testItemsRes?.config?.url),
          status: testItemsRes?.status,
          data: testItemsRes?.data,
        },
        comparison: {
          url: resolveAxiosUrl(axios, comparisonRes?.config?.url),
          status: comparisonRes?.status,
          data: comparisonRes?.data,
        },
      });

      const panelsData = panelsRes.data?.data ?? panelsRes.data ?? [];
      const testItemsData = testItemsRes.data?.data ?? testItemsRes.data ?? [];
      const comparison = comparisonRes.data?.data ?? comparisonRes.data ?? {};

      setPanels(Array.isArray(panelsData) ? panelsData : []);
      setTestItems(Array.isArray(testItemsData) ? testItemsData : []);

      const rawGrid =
        comparison?.grid ??
        comparison?.cells ??
        comparison?.data?.grid ??
        comparisonRes?.data?.data?.grid ??
        [];
      const nextGrid = normalizeComparisonGridToCells(rawGrid);
      setGrid(nextGrid);

      // Reconcile overrides: if backend now matches an override, drop it.
      setGridOverrides((prev) => {
        if (!prev || prev.size === 0) return prev;
        const backendMap = new Map();
        for (const cell of nextGrid || []) {
          if (!cell) continue;
          const pId = cellPanelId(cell);
          const tId = cellTestItemId(cell);
          if (pId == null || tId == null) continue;
          backendMap.set(gridKey(pId, tId), !!cell.included);
        }
        const updated = new Map(prev);
        for (const [k, v] of updated.entries()) {
          if (backendMap.has(k) && backendMap.get(k) === !!v) {
            updated.delete(k);
          }
        }
        return updated;
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load pricing structure");
    } finally {
      await ensureMinDuration(startedAt, 400);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        GRID_OVERRIDES_STORAGE_KEY,
        JSON.stringify(Array.from(gridOverrides.entries()))
      );
    } catch {
      // ignore storage failures
    }
  }, [gridOverrides]);

  const openPanelModal = (panel = null) => {
    setEditingPanel(panel);
    setPanelForm({
      name: panel?.name ?? "",
      displayOrder:
        panel?.displayOrder == null || panel?.displayOrder === ""
          ? ""
          : String(panel.displayOrder),
      accountNo: panel?.accountNo ?? "",
      panelTestCode: panel?.panelTestCode ?? "",
      priceCents:
        panel?.priceCents == null || panel?.priceCents === "" ? "" : String(panel.priceCents),
    });
    setPanelModalOpen(true);
  };

  const savePanel = async (e) => {
    e.preventDefault();
    const payload = {
      name: panelForm.name?.trim(),
      displayOrder: normalizeNumber(panelForm.displayOrder),
      accountNo: panelForm.accountNo?.trim(),
      panelTestCode: panelForm.panelTestCode?.trim(),
      priceCents: normalizeNumber(panelForm.priceCents),
    };

    if (!payload.name) return toast.error("Panel name is required");
    if (!payload.accountNo) return toast.error("Account No is required");
    if (!payload.panelTestCode) return toast.error("Panel test code is required");
    if (!Number.isFinite(payload.priceCents) || payload.priceCents < 0) {
      return toast.error("Price (cents) must be a number (0 or greater)");
    }

    const startedAt = Date.now();
    try {
      setSaving(true);
      if (editingPanel) {
        await axios.put(`/panels/${editingPanel.id}`, payload);
        toast.success("Panel updated");
      } else {
        await axios.post("/panels", payload);
        toast.success("Panel created");
      }
      setPanelModalOpen(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save panel");
    } finally {
      await ensureMinDuration(startedAt, 400);
      setSaving(false);
    }
  };

  const deletePanel = async (panel) => {
    if (!panel?.id) return;
    const ok = window.confirm(`Deactivate panel "${panel?.name ?? panel.id}"?`);
    if (!ok) return;

    const startedAt = Date.now();
    try {
      setSaving(true);
      await axios.delete(`/panels/${panel.id}`);
      toast.success("Panel deactivated");
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to deactivate panel");
    } finally {
      await ensureMinDuration(startedAt, 400);
      setSaving(false);
    }
  };

  const openTestItemModal = (item = null) => {
    setEditingTestItem(item);
    setTestItemForm({
      name: item?.name ?? "",
      category: String(item?.category ?? "DRUG").toUpperCase(),
      displayOrder:
        item?.displayOrder == null || item?.displayOrder === "" ? "" : String(item.displayOrder),
    });
    setTestItemModalOpen(true);
  };

  const saveTestItem = async (e) => {
    e.preventDefault();
    const payload = {
      name: testItemForm.name?.trim(),
      category: String(testItemForm.category ?? "").toUpperCase() || "DRUG",
      displayOrder: normalizeNumber(testItemForm.displayOrder),
    };
    if (!payload.name) return toast.error("Test item name is required");
    if (!["DRUG", "SVT"].includes(payload.category)) return toast.error("Invalid category");

    const startedAt = Date.now();
    try {
      setSaving(true);
      if (editingTestItem) {
        await axios.put(`/test-items/${editingTestItem.id}`, payload);
        toast.success("Test item updated");
      } else {
        await axios.post("/test-items", payload);
        toast.success("Test item created");
      }
      setTestItemModalOpen(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save test item");
    } finally {
      await ensureMinDuration(startedAt, 400);
      setSaving(false);
    }
  };

  const deleteTestItem = async (item) => {
    if (!item?.id) return;
    const ok = window.confirm(`Deactivate test item "${item?.name ?? item.id}"?`);
    if (!ok) return;

    const startedAt = Date.now();
    try {
      setSaving(true);
      await axios.delete(`/test-items/${item.id}`);
      toast.success("Test item deactivated");
      await loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to deactivate test item");
    } finally {
      await ensureMinDuration(startedAt, 400);
      setSaving(false);
    }
  };

  const toggleIncluded = async (panelId, testItemId) => {
    const key = gridKey(panelId, testItemId);
    const current = includedMap.get(key) ?? false;
    const next = !current;

    const relativeUrl = `/panels/${panelId}/test-items/${testItemId}`;
    console.log("[PricingStructure] toggle: PUT(full)", resolveAxiosUrl(axios, relativeUrl), {
      included: next,
      prevIncluded: current,
    });

    // Optimistic update
    setGrid((prev) => {
      const existingIdx = (prev || []).findIndex(
        (c) => String(c?.panelId) === String(panelId) && String(c?.testItemId) === String(testItemId)
      );
      if (existingIdx === -1) return [...(prev || []), { panelId, testItemId, included: next }];
      const copy = [...prev];
      copy[existingIdx] = { ...copy[existingIdx], included: next };
      return copy;
    });
    setGridOverrides((prev) => {
      const updated = new Map(prev);
      updated.set(key, next);
      return updated;
    });

    try {
      const res = await axios.put(relativeUrl, { included: next });
      console.log("[PricingStructure] toggle: response:", {
        url: resolveAxiosUrl(axios, res?.config?.url),
        status: res?.status,
        data: res?.data,
      });
    } catch (err) {
      console.error(err);
      console.log("[PricingStructure] toggle: FAILED", {
        url: resolveAxiosUrl(axios, err?.config?.url),
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      // Revert on failure
      setGrid((prev) => {
        const existingIdx = (prev || []).findIndex(
          (c) => String(c?.panelId) === String(panelId) && String(c?.testItemId) === String(testItemId)
        );
        if (existingIdx === -1) return prev || [];
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], included: current };
        return copy;
      });
      setGridOverrides((prev) => {
        const updated = new Map(prev);
        updated.set(key, current);
        return updated;
      });
      toast.error("Failed to update cell");
    }
  };

  const Tabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {[
        { id: "PANELS", label: "Panels" },
        { id: "TEST_ITEMS", label: "Test Items" },
        { id: "PREVIEW", label: "Preview" },
      ].map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md border transition ${
              active
                ? "bg-gray-800 text-cyan-300 border-gray-700"
                : "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-cyan-200"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const Matrix = ({ editable }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full text-xs text-left text-white">
        <thead className="bg-gray-800 text-cyan-300">
          <tr>
            <th className="py-2 px-3 whitespace-nowrap">Test Items</th>
            {sortedPanels.map((p) => (
              <th key={p.id} className="py-2 px-3 whitespace-nowrap">
                <span className="font-semibold">{p.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {sortedTestItems.length === 0 ? (
            <tr>
              <td
                colSpan={1 + sortedPanels.length}
                className="py-6 text-center text-gray-500"
              >
                No test items found
              </td>
            </tr>
          ) : (
            sortedTestItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-800 transition">
                <td className="py-2 px-3 whitespace-nowrap">
                  <span className="font-medium">
                    {item.name}{" "}
                    <span className="text-gray-400">
                      ({String(item.category || "DRUG").toLowerCase()})
                    </span>
                  </span>
                </td>
                {sortedPanels.map((p) => {
                  const included = includedMap.get(gridKey(p.id, item.id)) ?? false;
                  const Icon = included ? FiCheck : FiMinus;
                  return (
                    <td key={`${p.id}_${item.id}`} className="py-2 px-3">
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => (editable ? toggleIncluded(p.id, item.id) : null)}
                        className={`w-7 h-7 inline-flex items-center justify-center rounded border transition ${
                          included
                            ? "bg-cyan-600/15 border-cyan-500 text-cyan-300 hover:bg-cyan-600/25"
                            : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-800"
                        } ${!editable ? "cursor-default opacity-80 hover:bg-inherit" : ""}`}
                        aria-label={included ? "Included" : "Not included"}
                        title={included ? "Included" : "Not included"}
                      >
                        <Icon />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <AuthGuard>
      <Layout>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-semibold text-white">Pricing Structure</h1>
          <div className="flex gap-3 flex-wrap">
            {activeTab === "PREVIEW" ? (
              editPricing ? (
                <LoadingButton
                  type="button"
                  loading={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white"
                  onClick={async () => {
                    const startedAt = Date.now();
                    try {
                      setSaving(true);
                      await loadAll();
                      setEditPricing(false);
                      toast.success("Pricing updated");
                    } finally {
                      await ensureMinDuration(startedAt, 400);
                      setSaving(false);
                    }
                  }}
                >
                  Save
                </LoadingButton>
              ) : (
                <>
                  <button
                    type="button"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-700 transition"
                    onClick={loadAll}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="bg-cyan-700 border border-cyan-600 hover:bg-cyan-800 text-white px-4 py-2 rounded-md transition"
                    onClick={() => {
                      setEditPricing(true);
                      setActiveTab("PREVIEW");
                    }}
                  >
                    Edit pricing
                  </button>
                </>
              )
            ) : (
              <button
                type="button"
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-700 transition"
                onClick={loadAll}
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        <Tabs />

        {loading ? (
          <LoadingSpinner message="Loading pricing structure..." />
        ) : (
          <>
            {activeTab === "PANELS" ? (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                    onClick={() => openPanelModal()}
                  >
                    <FiPlus /> Add Panel
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="min-w-full text-sm text-left text-white">
                    <thead className="bg-gray-800 text-cyan-300">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Display</th>
                        <th className="py-3 px-4">Account No</th>
                        <th className="py-3 px-4">Panel ID</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {sortedPanels.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-gray-500">
                            No panels found
                          </td>
                        </tr>
                      ) : (
                        sortedPanels.map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-gray-800 transition cursor-pointer"
                            onClick={() => setSelectedPanel(p)}
                          >
                            <td className="py-3 px-4">{p.id}</td>
                            <td className="py-3 px-4">{p.name}</td>
                            <td className="py-3 px-4">{p.displayOrder ?? "-"}</td>
                            <td className="py-3 px-4">{p.accountNo ?? "-"}</td>
                            <td className="py-3 px-4">{p.panelTestCode ?? "-"}</td>
                            <td className="py-3 px-4">
                              {p.priceCents == null ? "-" : `$${(Number(p.priceCents) / 100).toFixed(2)}`}
                            </td>
                            <td
                              className="py-3 px-4 flex gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="text-blue-400 hover:text-blue-600"
                                onClick={() => openPanelModal(p)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                type="button"
                                className="text-red-400 hover:text-red-600"
                                onClick={() => deletePanel(p)}
                                title="Deactivate"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {activeTab === "TEST_ITEMS" ? (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                    onClick={() => openTestItemModal()}
                  >
                    <FiPlus /> Add Test Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="min-w-full text-sm text-left text-white">
                    <thead className="bg-gray-800 text-cyan-300">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Display</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-700">
                      {sortedTestItems.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-gray-500">
                            No test items found
                          </td>
                        </tr>
                      ) : (
                        sortedTestItems.map((ti) => (
                          <tr
                            key={ti.id}
                            className="hover:bg-gray-800 transition cursor-pointer"
                            onClick={() => setSelectedTestItem(ti)}
                          >
                            <td className="py-3 px-4">{ti.id}</td>
                            <td className="py-3 px-4">{ti.name}</td>
                            <td className="py-3 px-4">{ti.category ?? "-"}</td>
                            <td className="py-3 px-4">{ti.displayOrder ?? "-"}</td>
                            <td
                              className="py-3 px-4 flex gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="text-blue-400 hover:text-blue-600"
                                onClick={() => openTestItemModal(ti)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                type="button"
                                className="text-red-400 hover:text-red-600"
                                onClick={() => deleteTestItem(ti)}
                                title="Deactivate"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {activeTab === "PREVIEW" ? (
              <>
                <p className="text-gray-400 mb-4">
                  Preview of the comparison table (same data as <code className="text-gray-300">GET /api/panel-comparison</code>).
                </p>
                <Matrix editable={!!editPricing} />
              </>
            ) : null}

            {/* Matrix should only display on Preview tab */}
          </>
        )}

        {/* Panel Add/Edit Modal */}
        {panelModalOpen ? (
          <ModalShell
            title={editingPanel ? "Edit Panel" : "Add Panel"}
            onClose={() => setPanelModalOpen(false)}
          >
            <form onSubmit={savePanel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Name *</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={panelForm.name}
                    onChange={(e) => setPanelForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Display Order</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={panelForm.displayOrder}
                    onChange={(e) => setPanelForm((p) => ({ ...p, displayOrder: e.target.value }))}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Account No *</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={panelForm.accountNo}
                    onChange={(e) => setPanelForm((p) => ({ ...p, accountNo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Panel Test Code *</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={panelForm.panelTestCode}
                    onChange={(e) => setPanelForm((p) => ({ ...p, panelTestCode: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Price (cents) *</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={panelForm.priceCents}
                    onChange={(e) => setPanelForm((p) => ({ ...p, priceCents: e.target.value }))}
                    inputMode="numeric"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Example: 1240 → ${(1240 / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
                  onClick={() => setPanelModalOpen(false)}
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  loading={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white"
                >
                  Save
                </LoadingButton>
              </div>
            </form>
          </ModalShell>
        ) : null}

        {/* Test Item Add/Edit Modal */}
        {testItemModalOpen ? (
          <ModalShell
            title={editingTestItem ? "Edit Test Item" : "Add Test Item"}
            onClose={() => setTestItemModalOpen(false)}
          >
            <form onSubmit={saveTestItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">Name *</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={testItemForm.name}
                    onChange={(e) => setTestItemForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={testItemForm.category}
                    onChange={(e) => setTestItemForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Display Order</label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={testItemForm.displayOrder}
                    onChange={(e) =>
                      setTestItemForm((p) => ({ ...p, displayOrder: e.target.value }))
                    }
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
                  onClick={() => setTestItemModalOpen(false)}
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  loading={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition text-white"
                >
                  Save
                </LoadingButton>
              </div>
            </form>
          </ModalShell>
        ) : null}

        {/* Details Modals (standard component used elsewhere) */}
        <DetailsModal
          isOpen={!!selectedPanel}
          onClose={() => setSelectedPanel(null)}
          title="Panel Details"
          data={selectedPanel}
          fields={
            selectedPanel
              ? [
                  { key: "id", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "displayOrder", label: "Display Order" },
                  {
                    key: "priceCents",
                    label: "Price",
                    format: (val) =>
                      val == null ? "-" : `$${(Number(val) / 100).toFixed(2)}`,
                  },
                ]
              : []
          }
        />

        <DetailsModal
          isOpen={!!selectedTestItem}
          onClose={() => setSelectedTestItem(null)}
          title="Test Item Details"
          data={selectedTestItem}
          fields={
            selectedTestItem
              ? [
                  { key: "id", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "category", label: "Category" },
                  { key: "displayOrder", label: "Display Order" },
                ]
              : []
          }
        />
      </Layout>
    </AuthGuard>
  );
}

