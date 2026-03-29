"use client";
import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    owner: "",
    phone: "",
    city: "",
    note: "",
  });

  const [images, setImages] = useState<string[]>([]);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImages((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  }

  function saveLead() {
    if (!form.owner || !form.phone || !form.city) {
      alert("Compila nome, telefono e città.");
      return;
    }

    const existing = JSON.parse(localStorage.getItem("leads") || "[]");

    const duplicate = existing.some(
      (l: any) =>
        l.phone === form.phone ||
        (
          String(l.owner || "").toLowerCase() === form.owner.toLowerCase() &&
          String(l.city || "").toLowerCase() === form.city.toLowerCase()
        )
    );

    const newLead = {
      id: Date.now(),
      owner: form.owner,
      phone: form.phone,
      city: form.city,
      note: form.note,
      status: "Nuova",
      images,
      duplicate,
    };

    localStorage.setItem("leads", JSON.stringify([newLead, ...existing]));

    setForm({
      owner: "",
      phone: "",
      city: "",
      note: "",
    });
    setImages([]);

    alert("Segnalazione inviata.");
  }

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Segnalapp</h1>
      <p style={{ marginBottom: 24, color: "#555" }}>
        Invia una segnalazione immobiliare in modo rapido.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Nome proprietario / referente"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
        />

        <input
          placeholder="Telefono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
        />

        <input
          placeholder="Città"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
        />

        <textarea
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc", minHeight: 120 }}
        />

        <div>
          <p><strong>Scatta foto</strong></p>
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} />
        </div>

        <div>
          <p><strong>Carica da galleria</strong></p>
          <input type="file" accept="image/*" onChange={handleImage} />
        </div>

        {!!images.length && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {images.map((img, i) => (
              <img key={i} src={img} alt={`preview-${i}`} width={100} style={{ borderRadius: 8 }} />
            ))}
          </div>
        )}

        <button
          onClick={saveLead}
          style={{
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: "#1f4d8f",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Invia segnalazione
        </button>
      </div>
    </main>
  );
}