"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient ();
  
  const [form, setForm] = useState({
    reporterName: "",
    reporterPhone: "",
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

  const reporterName = form.reporterName.trim();
  const reporterPhone = form.reporterPhone.replace(/\s/g, "").trim();

  if (!reporterName || !reporterPhone) {
    alert("Compila nome e telefono del segnalatore.");
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

  let reporterId: number | null = null;

  const { data: reporterRows, error: reporterFindError } = await supabase
  .from("reporters")
  .select("*")
  .eq("phone", reporterPhone)
  .eq("is_active", true)
  .limit(1);

if (reporterFindError) {
  alert("Errore nel recupero del segnalatore.");
  console.error(reporterFindError);
  return;
}

const reporterFound = reporterRows && reporterRows.length > 0 ? reporterRows[0] : null;

  if (reporterFindError) {
    alert("Errore nel recupero del segnalatore.");
    console.error(reporterFindError);
    return;
  }

  if (reporterFound) {
    reporterId = reporterFound.id;

    const { error: reporterUpdateError } = await supabase
      .from("reporters")
      .update({
        total_leads: reporterFound.total_leads + 1,
        duplicates: reporterFound.duplicates + (duplicate ? 1 : 0),
        score: reporterFound.score + (duplicate ? -2 : 2),
      })
      .eq("id", reporterId);

    if (reporterUpdateError) {
      alert("Errore aggiornando il segnalatore.");
      console.error(reporterUpdateError);
      return;
    }
  } else {
    const { data: newReporter, error: reporterInsertError } = await supabase
      .from("reporters")
      .insert([
        {
          name: reporterName,
          phone: reporterPhone,
          total_leads: 1,
          duplicates: duplicate ? 1 : 0,
          score: duplicate ? -2 : 2,
        },
      ])
      .select()
      .single();

    if (reporterInsertError) {
      alert("Errore creando il segnalatore.");
      console.error(reporterInsertError);
      return;
    }

    reporterId = newReporter.id;
  }

  const { error } = await supabase.from("leads").insert([
    {
      reporter_id: reporterId,
      reporter_name: reporterName,
      reporter_phone: reporterPhone,
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
    reporterName: "",
    reporterPhone: "",
    owner: "",
    phone: "",
    city: "",
    note: "",
  });
  setImages([]);
  setShowForm(false);

  alert("Segnalazione inviata.");
}

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #ff8c1a, #ffa94d)",
        display: "flex",
        justifyContent: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: "white", margin: 0 }}>Segnalapp</h1>
          <p style={{ color: "white", opacity: 0.8, marginTop: 4 }}>
            Segnala immobili in modo rapido
          </p>
        </div>

        {!showForm && (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: "100%",
                padding: 26,
                borderRadius: 18,
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
        )}

        {showForm && (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <strong>Nuova segnalazione</strong>

              <button
                onClick={() => setShowForm(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Nome segnalatore"
              value={form.reporterName}
              onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />

            <input
              placeholder="Telefono segnalatore"
              value={form.reporterPhone}
              onChange={(e) => setForm({ ...form, reporterPhone: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />

            <input
              placeholder="Nome proprietario"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
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
                borderRadius: 12,
                border: "1px solid #ddd",
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
                borderRadius: 12,
                border: "1px solid #ddd",
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
                borderRadius: 12,
                border: "1px solid #ddd",
                minHeight: 100,
              }}
            />

            <div style={{ marginBottom: 10 }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
              />
            </div>

            {!!images.length && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`preview-${i}`}
                    width={80}
                    style={{ borderRadius: 10 }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={saveLead}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
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