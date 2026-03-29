"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [form, setForm] = useState({
    owner: "",
    phone: "",
    city: "",
    note: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImages((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  }

async function saveLead() {
  if (!form.owner || !form.phone || !form.city) {
    alert("Compila nome, telefono e città.");
    return;
  }

  const { data: existingLeads, error: fetchError } = await supabase
    .from("leads")
    .select("owner, phone, city");

  if (fetchError) {
    alert("Errore nel controllo doppioni.");
    console.error(fetchError);
    return;
  }

  const duplicate = (existingLeads || []).some(
    (l: any) =>
      l.phone === form.phone ||
      (
        String(l.owner || "").toLowerCase() === form.owner.toLowerCase() &&
        String(l.city || "").toLowerCase() === form.city.toLowerCase()
      )
  );

  const { error } = await supabase.from("leads").insert([
    {
      owner: form.owner,
      phone: form.phone,
      city: form.city,
      note: form.note,
      status: "Nuova",
      duplicate,
      images,
    },
  ]);

  if (error) {
    alert("Errore nel salvataggio.");
    console.error(error);
    return;
  }

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
  <main
    style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #ff8c1a, #ffa94d)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: 20,
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div style={{ width: "100%", maxWidth: 420 }}>
      <h1 style={{ color: "white", marginBottom: 20 }}>Segnalapp</h1>

      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 16,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%",
            padding: 24,
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg, #0f5132, #198754)",
            color: "white",
            fontSize: 22,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🏠 Segnala un immobile
        </button>
      </div>

      {showForm && (
        <div
          style={{
            marginTop: 20,
            background: "white",
            padding: 16,
            borderRadius: 16,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          }}
        >
          <input
            placeholder="Nome proprietario / referente"
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />

          <input
            placeholder="Telefono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />

          <input
            placeholder="Città"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />

          <textarea
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 10,
              borderRadius: 10,
              border: "1px solid #ccc",
              minHeight: 120,
            }}
          />

          <div style={{ marginBottom: 10 }}>
            <p><strong>Scatta foto</strong></p>
            <input type="file" accept="image/*" capture="environment" onChange={handleImage} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <p><strong>Carica da galleria</strong></p>
            <input type="file" accept="image/*" onChange={handleImage} />
          </div>

          {!!images.length && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`preview-${i}`}
                  width={100}
                  style={{ borderRadius: 8 }}
                />
              ))}
            </div>
          )}

          <button
            onClick={saveLead}
            style={{
              width: "100%",
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
      )}
    </div>
  </main>
);
}