"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type Lead = {
  id: number;
  reporter_name?: string;
  reporter_phone?: string;
  owner: string;
  phone: string;
  city: string;
  note: string;
  status: string;
  images: string[];
  duplicate?: boolean;
};

export default function AdminPage() {
  const supabase = createClient();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState("Tutte");
  const [duplicateFilter, setDuplicateFilter] = useState("Tutti");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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
  }, [supabase]);

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

  async function deleteLead(id: number) {
    const conferma = window.confirm("Vuoi davvero eliminare questa segnalazione?");
    if (!conferma) return;

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Errore eliminando la segnalazione.");
      console.error(error);
      return;
    }

    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Nuova":
        return "#6c757d";
      case "Da contattare":
        return "#0d6efd";
      case "Contattata":
        return "#0dcaf0";
      case "Non interessato":
        return "#dc3545";
      case "Appuntamento fissato":
        return "#ffc107";
      case "In trattativa":
        return "#fd7e14";
      case "Acquisito":
        return "#198754";
      case "Venduto":
        return "#14532d";
      default:
        return "#999";
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const okStatus =
        statusFilter === "Tutte" ? true : lead.status === statusFilter;

      const okDuplicate =
        duplicateFilter === "Tutti"
          ? true
          : duplicateFilter === "Doppioni"
          ? !!lead.duplicate
          : !lead.duplicate;

      return okStatus && okDuplicate;
    });
  }, [leads, statusFilter, duplicateFilter]);

  const dashboardStats = useMemo(() => {
  return {
    total: leads.length,
    new: leads.filter((lead) => lead.status === "Nuova").length,
    toContact: leads.filter((lead) => lead.status === "Da contattare").length,
    contacted: leads.filter((lead) => lead.status === "Contattata").length,
    appointments: leads.filter((lead) => lead.status === "Appuntamento fissato").length,
    negotiation: leads.filter((lead) => lead.status === "In trattativa").length,
    acquired: leads.filter((lead) => lead.status === "Acquisito").length,
    sold: leads.filter((lead) => lead.status === "Venduto").length,
    duplicates: leads.filter((lead) => !!lead.duplicate).length,
  };
}, [leads]);

  return (
    <>
      <main
        style={{
          padding: 24,
          fontFamily: "Arial, sans-serif",
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <h1 style={{ margin: 0 }}>Admin Segnalapp</h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href="/admin/segnalatori"
              style={{
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: 8,
                background: "#1f4d8f",
                color: "white",
                fontWeight: 700,
              }}
            >
              Vai ai segnalatori
            </Link>

            <button
              onClick={handleLogout}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#b91c1c",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
         <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
           <div style={{ fontSize: 13, color: "#666" }}>Totale lead</div>
           <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.total}</div>
         </div>

          <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
           <div style={{ fontSize: 13, color: "#666" }}>Nuove</div>
           <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.new}</div>
         </div>

         <div style={{ background: "#e7f1ff", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
           <div style={{ fontSize: 13, color: "#666" }}>Da contattare</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.toContact}</div>
         </div>

        <div style={{ background: "#fff3cd", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
          <div style={{ fontSize: 13, color: "#666" }}>Appuntamenti</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.appointments}</div>
        </div>

        <div style={{ background: "#ffe5d0", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
          <div style={{ fontSize: 13, color: "#666" }}>Trattative</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.negotiation}</div>
        </div>

        <div style={{ background: "#d1e7dd", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
          <div style={{ fontSize: 13, color: "#666" }}>Acquisiti</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.acquired}</div>
        </div>

        <div style={{ background: "#cfe2d9", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
          <div style={{ fontSize: 13, color: "#666" }}>Venduti</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.sold}</div>
        </div>

        <div style={{ background: "#f8d7da", borderRadius: 12, padding: 16, border: "1px solid #ddd" }}>
          <div style={{ fontSize: 13, color: "#666" }}>Doppioni</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.duplicates}</div>
        </div>
      </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8 }}
          >
            <option>Tutte</option>
            <option>Nuova</option>
            <option>Da contattare</option>
            <option>Contattata</option>
            <option>Non interessato</option>
            <option>Appuntamento fissato</option>
            <option>In trattativa</option>
            <option>Acquisito</option>
            <option>Venduto</option>
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
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: getStatusColor(lead.status),
                  color: lead.status === "Appuntamento fissato" ? "#222" : "white",
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                {lead.status}
              </div>

              <div>
                <strong>{lead.owner}</strong>{" "}
                {lead.duplicate && (
                  <span style={{ color: "red", fontWeight: 700 }}>DOPPIONE</span>
                )}
              </div>
            </div>

            <div>{lead.phone}</div>
            <div>{lead.city}</div>
            <div style={{ margin: "8px 0" }}>{lead.note}</div>

            <div style={{ marginTop: 8, fontSize: 14, color: "#444" }}>
              <strong>Segnalatore:</strong> {lead.reporter_name || "—"}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, color: "#444" }}>
              <strong>Tel. segnalatore:</strong> {lead.reporter_phone || "—"}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 12,
                marginBottom: 12,
              }}
            >
              <select
                value={lead.status}
                onChange={(e) => updateStatus(lead.id, e.target.value)}
                style={{ padding: 10, borderRadius: 8 }}
              >
                <option>Nuova</option>
                <option>Da contattare</option>
                <option>Contattata</option>
                <option>Non interessato</option>
                <option>Appuntamento fissato</option>
                <option>In trattativa</option>
                <option>Acquisito</option>
                <option>Venduto</option>
              </select>

              <button
                onClick={() => deleteLead(lead.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#b91c1c",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Elimina
              </button>
            </div>

            {!!lead.images?.length && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {lead.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`lead-${lead.id}-${i}`}
                    width={90}
                    style={{
                      borderRadius: 8,
                      cursor: "pointer",
                      border: "1px solid #ddd",
                    }}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </main>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              X
            </button>

            <img
              src={selectedImage}
              alt="Anteprima grande"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: 12,
                display: "block",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}