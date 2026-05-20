import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

function rp(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default async function Home() {
  const products = await getProducts();
  const safeProducts = products.map((p) => ({
    id: p.id,
    nama: p.nama,
    harga: Number(p.harga)
  }));
  const productsJson = JSON.stringify(safeProducts).replace(/</g, "\\u003c");

  return (
    <main className="user-page">
      <style>{`
        :root {
          --cyan:#00f0ff;
          --bg:#030308;
          --text:#eaeaea;
          --sub:#8a8f9a;
          --border:rgba(255,255,255,.08);
          --glass:rgba(255,255,255,.035);
        }
        body {
          margin:0;
          background:radial-gradient(circle at top right,rgba(0,240,255,.12),transparent 35%),#030308;
          color:var(--text);
          font-family:Arial, sans-serif;
        }
        .user-page {
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:24px;
        }
        .card {
          width:100%;
          max-width:460px;
          border:1px solid var(--border);
          background:var(--glass);
          border-radius:24px;
          padding:24px;
          box-shadow:0 30px 80px rgba(0,0,0,.45);
          backdrop-filter:blur(18px);
        }
        .brand {
          font-size:28px;
          font-weight:800;
          letter-spacing:.08em;
          margin-bottom:6px;
        }
        .sub {
          color:var(--sub);
          font-size:13px;
          margin-bottom:22px;
        }
        .products {
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
          margin-bottom:18px;
        }
        .product {
          border:1px solid var(--border);
          background:rgba(0,0,0,.22);
          color:var(--text);
          border-radius:16px;
          padding:14px;
          text-align:left;
        }
        .product.active {
          border-color:var(--cyan);
          box-shadow:0 0 0 2px rgba(0,240,255,.1);
        }
        .product b {
          display:block;
          font-size:20px;
          margin-bottom:4px;
        }
        .product span {
          color:var(--sub);
          font-size:12px;
        }
        label {
          display:block;
          color:var(--sub);
          font-size:12px;
          font-weight:700;
          margin-bottom:8px;
          text-transform:uppercase;
          letter-spacing:.08em;
        }
        input {
          width:100%;
          box-sizing:border-box;
          border:1px solid var(--border);
          background:rgba(0,0,0,.28);
          color:var(--text);
          border-radius:14px;
          padding:14px;
          margin-bottom:16px;
          outline:none;
        }
        input:focus {
          border-color:var(--cyan);
        }
        .btn {
          width:100%;
          border:0;
          border-radius:16px;
          padding:15px;
          background:linear-gradient(135deg,var(--cyan),#8ff8ff);
          color:#001013;
          font-weight:900;
          cursor:pointer;
        }
        .msg {
          margin-top:14px;
          color:var(--sub);
          font-size:13px;
          text-align:center;
        }
      `}</style>

      <div className="card">
        <div className="brand">JASTEB</div>
        <div className="sub">Pilih produk, masukkan email, lalu lanjut pembayaran QRIS.</div>

        <div className="products" id="products">
          {safeProducts.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={`product ${i === 0 ? "active" : ""}`}
              data-id={p.id}
            >
              <b>{p.nama}</b>
              <span>Rp{rp(p.harga)}</span>
            </button>
          ))}
        </div>

        <form id="orderForm">
          <input type="hidden" id="selectedId" defaultValue={safeProducts[0]?.id || ""} />

          <label>Email</label>
          <input id="email" type="email" placeholder="email@gmail.com" required />

          <button className="btn" type="submit">Beli Sekarang</button>
          <div className="msg" id="msg"></div>
        </form>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            const products = ${productsJson};
            const productButtons = document.querySelectorAll(".product");
            const selectedId = document.getElementById("selectedId");
            const msg = document.getElementById("msg");

            productButtons.forEach((btn) => {
              btn.addEventListener("click", () => {
                productButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                selectedId.value = btn.dataset.id;
              });
            });

            document.getElementById("orderForm").addEventListener("submit", async (e) => {
              e.preventDefault();

              const email = document.getElementById("email").value.trim();
              const product = products.find((p) => p.id === selectedId.value);

              if (!product) {
                msg.textContent = "Produk tidak ditemukan";
                return;
              }

              msg.textContent = "Membuat transaksi...";

              const res = await fetch("/saveTransaksi.php", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  email,
                  result: product.nama,
                  harga: product.harga
                })
              });

              const data = await res.json();

              if (!data.success) {
                msg.textContent = data.msg || "Gagal membuat transaksi";
                return;
              }

              window.location.href = data.qris_url || "/qris.php?trx=" + encodeURIComponent(data.trx_id);
            });
          `
        }}
      />
    </main>
  );
}
