"use client";
import { useState } from "react";

type Lead = {
  id: number;
  owner: string;
  phone: string;
  city: string;
  note: string;
  status: string;
  images: string[];
  duplicate: boolean;
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"sender" | "admin">("sender");

  const [form, setForm] = useState({
    owner: "",
    phone: "",
    city: "",
    note: "",
  });

  const [images, setImages] = useState<string[]>([]);

  function isDuplicate(newLead: any) {
    return leads.some(
      (l) =>
        l.phone === newLead.phone ||
        (l.owner.toLowerCase() === newLead.owner.toLowerCase() &&
          l.city.toLowerCase() === newLead.city.toLowerCase())
    );
  }

  function handleImage(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImages((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  }

  function saveLead() {
    if (!form.owner || !form.phone || !form.city) {
      alert("Compila i campi principali");
      return;
    }

    const duplicate = isDuplicate(form);

    const newLead: Lead = {
      id: Date.now(),
      ...form,
      status: "Nuova",
      images,
      duplicate,
    };

    setLeads([newLead, ...leads]);
    setForm({ owner: "", phone: "", city: "", note: "" });
    setImages([]);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Segnalazioni Immobiliari</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setView("sender")}>Segnalatore</button>
        <button onClick={() => setView("admin")}>Admin</button>
      </div>

      {view === "sender" && (
        <div>
          <h2>Invia segnalazione</h2>

          <input
            placeholder="Nome"
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
          />
          <br />

          <input
            placeholder="Telefono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <br />

          <input
            placeholder="Città"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <br />

          <textarea
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <br />

          <h4>Foto</h4>

          <div>
            <p>Scatta foto</p>
            <input type="file" accept="image/*" capture="environment" onChange={handleImage} />
          </div>

          <div>
            <p>Galleria</p>
            <input type="file" accept="image/*" onChange={handleImage} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {images.map((img, i) => (
              <img key={i} src={img} width={100} />
            ))}
          </div>

          <br />
          <button onClick={saveLead}>Invia</button>
        </div>
      )}

      {view === "admin" && (
        <div>
          <h2>Admin</h2>

          {leads.map((lead) => (
            <div
              key={lead.id}
              style={{
                border: "1px solid gray",
                padding: 10,
                marginBottom: 10,
                background: lead.duplicate ? "#ffe5e5" : "white",
              }}
            >
              <b>{lead.owner}</b>{" "}
              {lead.duplicate && <span style={{ color: "red" }}>DOPPIONE</span>}
              <br />
              {lead.phone} - {lead.city}
              <br />
              {lead.note}
              <br />

              <select
                value={lead.status}
                onChange={(e) => {
                  setLeads(
                    leads.map((l) =>
                      l.id === lead.id ? { ...l, status: e.target.value } : l
                    )
                  );
                }}
              >
                <option>Nuova</option>
                <option>Contattata</option>
                <option>In valutazione</option>
                <option>Appuntamento</option>
                <option>Chiusa</option>
              </select>

              <div style={{ display: "flex", gap: 10 }}>
                {lead.images.map((img, i) => (
                  <a key={i} href={img} target="_blank">
                    <img src={img} width={80} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}