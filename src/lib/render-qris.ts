import type { Transaction } from "@/lib/types";
import { QRIS_TEMPLATE } from "@/lib/templates";
import { htmlEscape, numberFormat, phpDateJakarta } from "@/lib/utils";

function paidDisplayDate(value: string) {
  const s = String(value || "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return "";
}

export function renderQrisPage(trx: Transaction) {
  const isPaid = trx.status === "sukses";
  const expired = trx.expired || Math.floor(Date.now() / 1000) + 1200;
  const sisaWaktu = Math.max(0, expired - Math.floor(Date.now() / 1000));
  const persenAwal = Math.round((sisaWaktu / 1200) * 100);
  const waktuTrx = trx.waktu_bayar ? paidDisplayDate(String(trx.waktu_bayar)) : phpDateJakarta(new Date((expired - 1200) * 1000));
  const qrFile = `/qr/${encodeURIComponent(trx.pay_code)}.png`;

  return QRIS_TEMPLATE
    .replaceAll("__WAIT_STYLE__", isPaid ? "display:none" : "")
    .replaceAll("__TOTAL_FMT__", numberFormat(trx.total))
    .replaceAll("__QR_FILE__", qrFile)
    .replaceAll("__PERSEN_AWAL__", String(persenAwal))
    .replaceAll("__TRX_ID__", htmlEscape(trx.trx_id))
    .replaceAll("__RESULT__", htmlEscape(trx.result || "-"))
    .replaceAll("__SUCCESS_STYLE__", isPaid ? "" : "display:none")
    .replaceAll("__EMAIL__", htmlEscape(trx.email || "-"))
    .replaceAll("__WAKTU_TRX__", htmlEscape(waktuTrx || phpDateJakarta(new Date((expired - 1200) * 1000))))
    .replaceAll("__EXPIRED_INT__", String(Math.floor(expired)))
    .replaceAll("__STATUS_LOOKUP_ID__", htmlEscape(trx.pay_code))
    .replaceAll("__STATUS__", htmlEscape(trx.status));
}
