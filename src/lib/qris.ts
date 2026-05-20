function crc16Ccitt(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) {
      if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function removeTag54(qris: string) {
  let pos = 0;
  let result = "";
  while (pos < qris.length) {
    if (pos + 2 > qris.length) return false;
    const tag = qris.slice(pos, pos + 2);
    pos += 2;
    if (pos + 2 > qris.length) return false;
    const len = Number.parseInt(qris.slice(pos, pos + 2), 10);
    pos += 2;
    if (!Number.isFinite(len) || pos + len > qris.length) return false;
    const val = qris.slice(pos, pos + len);
    pos += len;
    if (tag !== "54") result += `${tag}${String(len).padStart(2, "0")}${val}`;
  }
  return result;
}

export function buildDynamicQris(staticQris: string, amount: number) {
  const qris = String(staticQris || "").trim();
  if (!qris) return `QRIS_STATIC_BELUM_DIISI|TOTAL=${amount}`;

  const tag54 = `54${String(String(amount).length).padStart(2, "0")}${amount}`;
  const qrisWithout54 = removeTag54(qris);
  if (qrisWithout54 === false) return qris;

  const pos63 = qrisWithout54.indexOf("6304");
  if (pos63 === -1) return qris;

  const modified = qrisWithout54.slice(0, pos63) + tag54 + qrisWithout54.slice(pos63);
  const payloadWithoutCrc = modified.slice(0, modified.length - 4);
  return payloadWithoutCrc + crc16Ccitt(payloadWithoutCrc);
}
