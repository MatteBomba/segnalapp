"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FormState = {
  reporterName: string;
  reporterPhone: string;
  owner: string;
  phone: string;
  city: string;
  note: string;
};

export default function Home() {
  const supabase = createClient();

  const [form, setForm] = useState<FormState>({
    reporterName: "",
    reporterPhone: "",
    owner: "",
    phone: "",
    city: "",
    note: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFiles((prev) => [...prev, file]);
    setPreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
  }

  async function uploadImages(reporterPhone: string) {
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const safeName = file.name.replace(/\s+/g, "-");
      const filePath = `${reporterPhone}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("lead-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("lead-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function saveLead() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!form.owner || !form.phone || !form.city) {
      alert("Compila nome, telefono e città.");
      setIsSubmitting(false);
      return;
    }

    const reporterName = form.reporterName.trim();
    const reporterPhone = form.reporterPhone.replace(/\s/g, "").trim();
    const trimmedNote = form.note.trim();

    if (!reporterName || !reporterPhone) {
      alert("Compila nome e telefono del segnalatore.");
      setIsSubmitting(false);
      return;
    }

    if (reporterPhone.length < 5 || reporterPhone === "000") {
      alert("Inserisci un telefono segnalatore valido.");
      setIsSubmitting(false);
      return;
    }

    const { data: existingLeads, error: fetchError } = await supabase
      .from("leads")
      .select("owner, phone, city");

    if (fetchError) {
      alert("Errore nel controllo doppioni.");
      console.error(fetchError);
      setIsSubmitting(false);
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

    const hasNotes = trimmedNote.length > 0;
    const hasGoodNotes = trimmedNote.length >= 20;
    const hasPhotos = imageFiles.length >= 1;
    const hasRichPhotos = imageFiles.length >= 3;

    let initialScore = duplicate ? -2 : 2;
    if (hasNotes) initialScore += 1;
    if (hasGoodNotes) initialScore += 1;
    if (hasPhotos) initialScore += 2;
    if (hasRichPhotos) initialScore += 1;

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
      setIsSubmitting(false);
      return;
    }

    const reporterFound =
      reporterRows && reporterRows.length > 0 ? reporterRows[0] : null;

    if (reporterFound) {
      reporterId = reporterFound.id;

      const { error: reporterUpdateError } = await supabase
        .from("reporters")
        .update({
          total_leads: reporterFound.total_leads + 1,
          duplicates: reporterFound.duplicates + (duplicate ? 1 : 0),
          notes_count: reporterFound.notes_count + (hasNotes ? 1 : 0),
          good_notes_count: reporterFound.good_notes_count + (hasGoodNotes ? 1 : 0),
          photos_count: reporterFound.photos_count + (hasPhotos ? 1 : 0),
          rich_photos_count: reporterFound.rich_photos_count + (hasRichPhotos ? 1 : 0),
          score: reporterFound.score + initialScore,
        })
        .eq("id", reporterId);

      if (reporterUpdateError) {
        alert("Errore aggiornando il segnalatore.");
        console.error(reporterUpdateError);
        setIsSubmitting(false);
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
            notes_count: hasNotes ? 1 : 0,
            good_notes_count: hasGoodNotes ? 1 : 0,
            photos_count: hasPhotos ? 1 : 0,
            rich_photos_count: hasRichPhotos ? 1 : 0,
            score: initialScore,
          },
        ])
        .select()
        .single();

      if (reporterInsertError) {
        alert("Errore creando il segnalatore.");
        console.error(reporterInsertError);
        setIsSubmitting(false);
        return;
      }

      reporterId = newReporter.id;
    }

    let uploadedImageUrls: string[] = [];

    try {
      uploadedImageUrls = await uploadImages(reporterPhone);
    } catch (uploadError) {
      alert("Errore nel caricamento immagini.");
      console.error(uploadError);
      setIsSubmitting(false);
      return;
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
        images: uploadedImageUrls,
      },
    ]);

    if (error) {
      alert("Errore nel salvataggio.");
      console.error(error);
      setIsSubmitting(false);
      return;
    }

    const { data: notifyData, error: notifyError } =
      await supabase.functions.invoke("notify-lead", {
        body: {
          reporterName,
          reporterPhone,
          owner: form.owner,
          phone: form.phone,
          city: form.city,
          note: form.note,
        },
      });

    console.log("NOTIFY DATA:", notifyData);
    console.log("NOTIFY ERROR:", notifyError);

    if (notifyError) {
      console.error("Errore invio notifica:", notifyError);
    }

    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setForm({
      reporterName: "",
      reporterPhone: "",
      owner: "",
      phone: "",
      city: "",
      note: "",
    });
    setImageFiles([]);
    setPreviewUrls([]);
    setShowForm(false);
    setIsSubmitting(false);

    alert("Grazie per la Segnalazione.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f5f5dc, #f3f4f6)",
        display: "flex",
        justifyContent: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: "#1f2937", margin: 0 }}>Segnalapp</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Segnala immobili rapidamente
          </p>
        </div>

        {!showForm && (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
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
              boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
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

            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 8, fontWeight: 700 }}>Aggiungi immagini</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label
                  htmlFor="camera-input"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#198754",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  📷 Scatta foto
                </label>

                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />

                <label
                  htmlFor="gallery-input"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#f97316",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🖼️ Galleria
                </label>

                <input
                  id="gallery-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {!!previewUrls.length && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                {previewUrls.map((img, i) => (
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
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "none",
                background: isSubmitting ? "#7a9cc7" : "#1f4d8f",
                color: "white",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.85 : 1,
              }}
            >
              {isSubmitting ? "Invio in corso..." : "Invia segnalazione"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}