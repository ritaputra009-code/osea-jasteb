import type { Product, Transaction } from "@/lib/types";
import { ADMIN_DASHBOARD_TEMPLATE, ADMIN_LOGIN_TEMPLATE } from "@/lib/templates";
import { htmlEscape, jsString, numberFormat, numberFormatId, phpEnglishDashboardDate } from "@/lib/utils";

const successIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

export function renderAdminLogin(error?: string) {
  const errorBlock = error
    ? `<div class="alert-error">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            ${htmlEscape(error)}
        </div>`
    : "";
  return ADMIN_LOGIN_TEMPLATE.replace("__LOGIN_ERROR_BLOCK__", errorBlock);
}

function emptyTransactionsBlock() {
  return `<div class="empty">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>Belum ada transaksi</p>
                </div>`;
}

function transactionRow(t: Transaction, realIdx: number) {
  const statusClass = t.status === "pending" ? "badge-pending" : "badge-sukses";
  const action = t.status === "pending" ? `<a href="?approve=${realIdx}" class="btn-approve">Approve</a>` : successIcon;
  return `<tr>
                                <td><span class="td-id">${htmlEscape(t.trx_id)}</span></td>
                                <td>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <span style="font-size:13px;font-weight:600;">${htmlEscape(t.email)}</span>
                                        <button class="act-btn copy" onclick="copyText('${jsString(t.email)}', this)" title="Salin">
                                            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                        </button>
                                    </div>
                                </td>
                                <td style="font-size:13px;color:var(--text-sub)">${htmlEscape(t.result)}</td>
                                <td><span class="td-price">Rp${numberFormat(t.total)}</span></td>
                                <td>
                                    <span class="badge ${statusClass}">
                                        <span class="badge-dot"></span> ${htmlEscape(t.status.toUpperCase())}
                                    </span>
                                </td>
                                <td style="text-align:center">
                                    ${action}
                                </td>
                            </tr>`;
}

function transactionsTable(rows: string) {
  return `<div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Trx</th>
                                <th>Pelanggan</th>
                                <th>Item</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th style="text-align:center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>`;
}

function renderLatestTransactions(transactions: Transaction[]) {
  if (transactions.length === 0) return emptyTransactionsBlock();
  const limit = transactions.slice(-5);
  const rows = [...limit].reverse().map((t, i) => {
    const realIdx = transactions.length - 1 - i;
    return transactionRow(t, realIdx);
  }).join("\n");
  return transactionsTable(rows);
}

function renderAllTransactions(transactions: Transaction[]) {
  if (transactions.length === 0) return emptyTransactionsBlock();
  const rows = [...transactions].reverse().map((t, i) => {
    const realIdx = transactions.length - 1 - i;
    return transactionRow(t, realIdx);
  }).join("\n");
  return transactionsTable(rows);
}

function renderProducts(products: Product[]) {
  if (products.length === 0) {
    return `<div class="empty">
                        <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <p>Belum ada produk</p>
                    </div>`;
  }

  const rows = products.map((r, i) => `<tr>
                                    <td class="td-name">${htmlEscape(r.nama)}</td>
                                    <td><span class="td-price">Rp${numberFormat(r.harga)}</span></td>
                                    <td style="text-align:right">
                                        <div style="display:flex;gap:6px;justify-content:flex-end;">
                                            <button class="act-btn edit" onclick="openEdit(${i}, '${jsString(r.nama)}', ${Number(r.harga)})" title="Edit">
                                                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                            <a href="?hapus_result=${i}" class="act-btn del" onclick="return confirm('Hapus produk ini?')" title="Hapus">
                                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            </a>
                                        </div>
                                    </td>
                                </tr>`).join("\n");

  return `<div class="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Nama Produk</th><th>Harga</th><th style="text-align:right">Aksi</th></tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>`;
}

export function renderAdminDashboard(products: Product[], transactions: Transaction[]) {
  const totalPendapatan = transactions.filter((t) => t.status === "sukses").reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalSukses = transactions.filter((t) => t.status === "sukses").length;
  const totalPending = transactions.filter((t) => t.status !== "sukses").length;

  return ADMIN_DASHBOARD_TEMPLATE
    .replaceAll("__DATE__", phpEnglishDashboardDate())
    .replaceAll("__PRODUCT_COUNT__", String(products.length))
    .replaceAll("__TOTAL_PENDAPATAN__", numberFormatId(totalPendapatan))
    .replaceAll("__TOTAL_PENDING__", String(totalPending))
    .replaceAll("__TOTAL_SUKSES__", String(totalSukses))
    .replaceAll("__LATEST_TRANSACTIONS_BLOCK__", renderLatestTransactions(transactions))
    .replaceAll("__PRODUCTS_BLOCK__", renderProducts(products))
    .replaceAll("__ALL_TRANSACTIONS_BLOCK__", renderAllTransactions(transactions));
}
