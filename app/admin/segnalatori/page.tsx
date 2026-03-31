"use client";
import { useEffect, useState } from "react";
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
  is_active: boolean;
};

export default function SegnalatoriPage() {
  const supabase = createClient();
  const [reporters, setReporters] = useState<Reporter[]>([]);

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
    const conferma = window.confirm("Vuoi davvero eliminare questo segnalatore?");
    if (!conferma) return;

    const { error } = await supabase
      .from("reporters")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      alert("Errore eliminando il segnalatore.");
      console.error(error);
      return;
    }

    setReporters((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        maxWidth: 900,
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

      {reporters.length === 0 && <p>Nessun segnalatore registrato.</p>}

      {reporters.map((reporter) => (
        <div
          key={reporter.id}
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div><strong>{reporter.name}</strong></div>
          <div>{reporter.phone || "—"}</div>

          <div style={{ marginTop: 8 }}>Segnalazioni totali: {reporter.total_leads}</div>
          <div>Doppioni: {reporter.duplicates}</div>
          <div>Appuntamenti fissati: {reporter.appointments}</div>
          <div>Acquisiti: {reporter.acquired}</div>
          <div>Venduti: {reporter.sold}</div>

          <div style={{ marginTop: 10 }}>
            <strong>Punteggio: {reporter.score}</strong>
          </div>

          <button
            onClick={() => deleteReporter(reporter.id)}
            style={{
              marginTop: 12,
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
        </div>
      ))}
    </main>
  );
}