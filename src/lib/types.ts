export type Product = {
  id: string;
  nama: string;
  harga: number;
  created_at?: string;
};

export type TransactionStatus = "pending" | "sukses" | "expired";

export type Transaction = {
  trx_id: string;
  pay_code: string;
  kode_unik: number;
  email: string;
  result: string;
  harga: number;
  total: number;
  status: TransactionStatus;
  expired: number;
  tanggal: string;
  waktu_bayar?: string | null;
  paid_time?: number | null;
  token?: string | null;
  unik?: string | null;
  created_at?: string;
};
