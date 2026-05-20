# JASTEB PHP ke Next.js Vercel

Versi ini dibuat dari file PHP yang kamu upload dan disiapkan untuk Vercel.

Perubahan sesuai permintaan:

- Kode unik pembayaran dibuat di server dengan range 100 sampai 500.
- URL halaman QRIS tidak memakai ID transaksi. URL memakai kode acak panjang kombinasi angka, huruf besar, dan huruf kecil.
- Tulisan dan tampilan halaman QRIS/Admin dipertahankan dari file PHP.

## ENV Vercel

Isi di Vercel Settings → Environment Variables:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
INFOSALDO_API_KEY
QRIS_STATIC
ADMIN_USER
ADMIN_PASSWORD
AUTH_SECRET
```

Default login admin mengikuti PHP lama:

```txt
ADMIN_USER=PW
ADMIN_PASSWORD=PW
```

## SQL Supabase

Jalankan isi file `supabase.sql` di Supabase SQL Editor.

## URL penting

```txt
/admin.php
/qris.php?trx=kodeAcakPanjang
/saveTransaksi.php
/cek.php
/cekStatus.php
/webhook.php
/lrm/admin.php
/lrm/qris.php
/lrm/saveTransaksi.php
/lrm/cek.php
/lrm/cekStatus.php
/lrm/webhook.php
/api/webhook
```

Webhook InfoSaldo bisa pakai:

```txt
https://domain-kamu.vercel.app/api/webhook
```

Header:

```txt
X-IS-APIKEY: isi INFOSALDO_API_KEY
```
