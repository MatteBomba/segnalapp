"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type Lead = {
  id: number;
  reporter_name?: string;
  reporter_phone?: string;
  status: string;
  duplicate?: boolean;
};

export default function SegnalatoriPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    async function loadLeads() {
      const { data, error } = await supabase
        .from("leads")
        .select("id, reporter_name, reporter_phone, status, duplicate");

      if (error) {
        console.error(error);
        return;
      }

      setLeads(data || []);
    }

    loadLeads();
  }, [supabase]);

  const reporters = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        leads: number;
        duplicates: number;
        appointments: number;
        acquired: number;
        sold: number;
        score: number;
      }
    >();

    leads.forEach((lead) => {
      const name = (lead.reporter_name || "Sconosciuto").trim().toLowerCase();
      const phone = (lead.reporter_phone || "").replace(/\s/g, "");
      const key = `${name}__${phone}`;

      if (!map.has(key)) {
        map.set(key, {
          name: lead.reporter_name || "Sconosciuto",
          phone: lead.reporter_phone || "",
          leads: 0,
          duplicates: 0,
          appointments: 0,
          acquired: 0,
          sold: 0,
          score: 0,
        });
      }

      const reporter = map.get(key)!;

      reporter.leads += 1;

      if (lead.duplicate) {
        reporter.duplicates += 1;
        reporter.score -= 2;
      } else {
        reporter.score += 2;
      }

      if (lead.status === "Appuntamento fissato") {
        reporter.appointments += 1;
        reporter.score += 5;
      }

      if (lead.status === "Acquisito") {
        reporter.acquired += 1;
        reporter.score += 10;
      }

      if (lead.status === "Venduto") {
        reporter.sold += 1;
        reporter.score += 20;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [leads]);

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

      {reporters.map((reporter, index) => (
        <div
          key={`${reporter.name}-${reporter.phone}-${index}`}
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

          <div style={{ marginTop: 8 }}>Segnalazioni totali: {reporter.leads}</div>
          <div>Doppioni: {reporter.duplicates}</div>
          <div>Appuntamenti fissati: {reporter.appointments}</div>
          <div>Acquisiti: {reporter.acquired}</div>
          <div>Venduti: {reporter.sold}</div>

          <div style={{ marginTop: 10 }}>
            <strong>Punteggio: {reporter.score}</strong>
          </div>
        </div>
      ))}
    </main>
  );
}