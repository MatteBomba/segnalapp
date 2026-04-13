"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type Reporter = {
  id: number;
  name: string;
  phone: string;
  score: number;
  total_leads: number;
  duplicates: number;
  appointments: number;
  acquired: number;
  sold: number;
  notes_count: number;
  good_notes_count: number;
  photos_count: number;
  rich_photos_count: number;
  is_active: boolean;
};

function getQualityStars(score: number, totalLeads: number) {
  if (!totalLeads) return "☆☆☆☆☆";

  const avg = score / totalLeads;

  if (avg >= 8) return "★★★★★";
  if (avg >= 6) return "★★★★☆";
  if (avg >= 4) return "★★★☆☆";
  if (avg >= 2) return "★★☆☆☆";
  return "★☆☆☆☆";
}

function getQualityLabel(score: number, totalLeads: number) {
  if (!totalLeads) return "Nuovo";

  const avg = score / totalLeads;

  if (avg >= 8) return "Premium";
  if (avg >= 6) return "Ottimo";
  if (avg >= 4) return "Buono";
  if (avg >= 2) return "Base";
  return "Debole";
}

function getPrecision(totalLeads: number, duplicates: number) {
  if (!totalLeads) return 0;
  return Math.max(0, Math.round(((totalLeads - duplicates) / totalLeads) * 100));
}

export default function SegnalatoriPage() {
  const supabase = createClient();
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [openReporterId, setOpenReporterId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("stars_desc");

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    async function loadReporters() {
      const { data, error } = await supabase
        .from("reporters")
        .select("*")
        .eq("is_active", true)
        .order("score", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setReporters(data || []);
    }

    loadReporters();
  }, [supabase]);

  async function deleteReporter(id: number) {
    const conferma = window.confirm("Vuoi davvero archiviare questo segnalatore?");
    if (!conferma) return;

    const { error } = await supabase
      .from("reporters")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      alert("Errore archiviando il segnalatore.");
      console.error(error);
      return;
    }

    setReporters((prev) => prev.filter((r) => r.id !== id));
  }

  const sortedReporters = useMemo(() => {
    return [...reporters].sort((a, b) => {
      const precisionA = getPrecision(a.total_leads, a.duplicates);
      const precisionB = getPrecision(b.total_leads, b.duplicates);

      const avgA = a.total_leads ? a.score / a.total_leads : 0;
      const avgB = b.total_leads ? b.score / b.total_leads : 0;

      switch (sortBy) {
        case "stars_desc":
          return avgB - avgA;

        case "stars_asc":
          return avgA - avgB;

        case "leads_desc":
          return b.total_leads - a.total_leads;

        case "leads_asc":
          return a.total_leads - b.total_leads;

        case "photos_desc":
          return b.photos_count - a.photos_count;

        case "photos_asc":
          return a.photos_count - b.photos_count;

        case "precision_desc":
          return precisionB - precisionA;

        case "precision_asc":
          return precisionA - precisionB;

        default:
          return 0;
      }
    });
  }, [reporters, sortBy]);

  return (
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
        <h1 style={{ margin: 0 }}>Archivio segnalatori</h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Link
            href="/admin"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#1f4d8f",
              color: "white",
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            Torna alle lead
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

      <div style={{ marginBottom: 20 }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontWeight: 600,
          }}
        >
          <option value="stars_desc">⭐ Più stelle</option>
          <option value="stars_asc">⭐ Meno stelle</option>
          <option value="leads_desc">📊 Più segnalazioni</option>
          <option value="leads_asc">📊 Meno segnalazioni</option>
          <option value="photos_desc">📸 Più foto</option>
          <option value="photos_asc">📸 Meno foto</option>
          <option value="precision_desc">🎯 Più precisione</option>
          <option value="precision_asc">🎯 Meno precisione</option>
        </select>
      </div>

      {sortedReporters.length === 0 && <p>Nessun segnalatore registrato.</p>}

      {sortedReporters.map((reporter) => {
        const stars = getQualityStars(reporter.score, reporter.total_leads);
        const label = getQualityLabel(reporter.score, reporter.total_leads);
        const precision = getPrecision(reporter.total_leads, reporter.duplicates);

        return (
          <div
            key={reporter.id}
            style={{
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{reporter.name}</div>
                <div style={{ color: "#555", marginTop: 4 }}>{reporter.phone || "—"}</div>
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#f3f4f6",
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 22 }}>{stars}</div>

            <div style={{ marginTop: 8 }}>
              <strong>Punteggio totale:</strong> {reporter.score}
            </div>
            <div>
              <strong>Precisione:</strong> {precision}%
            </div>

            <button
              onClick={() =>
                setOpenReporterId(openReporterId === reporter.id ? null : reporter.id)
              }
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#1f4d8f",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {openReporterId === reporter.id ? "Nascondi dettagli" : "Mostra dettagli"}
            </button>

            {openReporterId === reporter.id && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 10 }}>
                    <strong>Segnalazioni</strong>
                    <div>{reporter.total_leads}</div>
                  </div>

                  <div style={{ background: "#fef2f2", padding: 12, borderRadius: 10 }}>
                    <strong>Doppioni</strong>
                    <div>{reporter.duplicates}</div>
                  </div>

                  <div style={{ background: "#eff6ff", padding: 12, borderRadius: 10 }}>
                    <strong>Con note</strong>
                    <div>{reporter.notes_count}</div>
                  </div>

                  <div style={{ background: "#eef2ff", padding: 12, borderRadius: 10 }}>
                    <strong>Note complete</strong>
                    <div>{reporter.good_notes_count}</div>
                  </div>

                  <div style={{ background: "#ecfdf5", padding: 12, borderRadius: 10 }}>
                    <strong>Con foto</strong>
                    <div>{reporter.photos_count}</div>
                  </div>

                  <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10 }}>
                    <strong>3+ foto</strong>
                    <div>{reporter.rich_photos_count}</div>
                  </div>

                  <div style={{ background: "#fffbeb", padding: 12, borderRadius: 10 }}>
                    <strong>Appuntamenti</strong>
                    <div>{reporter.appointments}</div>
                  </div>

                  <div style={{ background: "#fef3c7", padding: 12, borderRadius: 10 }}>
                    <strong>Acquisiti</strong>
                    <div>{reporter.acquired}</div>
                  </div>

                  <div style={{ background: "#dcfce7", padding: 12, borderRadius: 10 }}>
                    <strong>Venduti</strong>
                    <div>{reporter.sold}</div>
                  </div>
                </div>

                <button
                  onClick={() => deleteReporter(reporter.id)}
                  style={{
                    marginTop: 14,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#6b7280",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Archivia segnalatore
                </button>
              </>
            )}
          </div>
        );
      })}
    </main>
  );
}