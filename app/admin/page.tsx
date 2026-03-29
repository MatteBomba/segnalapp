"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: number;
  owner: string;
  phone: string;
  city: string;
  note: string;
  status: string;
  images: string[];
  duplicate?: boolean;
};

const ADMIN_PASSWORD = "1234";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState("Tutte");
  const [duplicateFilter, setDuplicateFilter] = useState("Tutti");

  useEffect(() => {
  async function loadLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setLeads(data || []);
  }

  loadLeads();
}, []);

  function login() {
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
    } else {
      alert("Password errata");
    }
  }

  async function updateStatus(id: number, status: string) {
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert("Errore aggiornando lo stato.");
    console.error(error);
    return;
  }

  setLeads((prev) =>
    prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
  );
}

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const okStatus = statusFilter === "Tutte" ? true : lead.status === statusFilter;
      const okDuplicate =
        duplicateFilter === "Tutti"
          ? true
          : duplicateFilter === "Doppioni"
          ? !!lead.duplicate
          : !lead.duplicate;

      return okStatus && okDuplicate;
    });
  }, [leads, statusFilter, duplicateFilter]);

  if (!unlocked) {
    return (
      <main style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 500, margin: "0 auto" }}>
        <h1>Area Admin</h1>
        <p style={{ color: "#555", marginBottom: 16 }}>
          Inserisci la password per accedere.
        </p>

        <input
          type="password"
          placeholder="Password admin"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc", width: "100%", marginBottom: 12 }}
        />

        <button
          onClick={login}
          style={{
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Entra
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <h1>Admin Segnalapp</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 10, borderRadius: 8 }}
        >
          <option>Tutte</option>
          <option>Nuova</option>
          <option>Contattata</option>
          <option>In valutazione</option>
          <option>Appuntamento</option>
          <option>Chiusa</option>
        </select>

        <select
          value={duplicateFilter}
          onChange={(e) => setDuplicateFilter(e.target.value)}
          style={{ padding: 10, borderRadius: 8 }}
        >
          <option>Tutti</option>
          <option>Doppioni</option>
          <option>Unici</option>
        </select>
      </div>

      {filteredLeads.length === 0 && <p>Nessuna segnalazione.</p>}

      {filteredLeads.map((lead) => (
        <div
          key={lead.id}
          style={{
            border: lead.duplicate ? "2px solid red" : "1px solid #ccc",
            background: lead.duplicate ? "#fff1f1" : "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <strong>{lead.owner}</strong>{" "}
            {lead.duplicate && <span style={{ color: "red", fontWeight: 700 }}>DOPPIONE</span>}
          </div>

          <div>{lead.phone}</div>
          <div>{lead.city}</div>
          <div style={{ margin: "8px 0" }}>{lead.note}</div>

          <select
            value={lead.status}
            onChange={(e) => updateStatus(lead.id, e.target.value)}
            style={{ padding: 10, borderRadius: 8, marginBottom: 12 }}
          >
            <option>Nuova</option>
            <option>Contattata</option>
            <option>In valutazione</option>
            <option>Appuntamento</option>
            <option>Chiusa</option>
          </select>

          {!!lead.images?.length && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {lead.images.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noreferrer">
                  <img src={img} alt={`lead-${lead.id}-${i}`} width={90} style={{ borderRadius: 8 }} />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}