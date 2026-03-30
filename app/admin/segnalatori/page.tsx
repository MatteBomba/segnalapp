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
  const supabase = createClient() ;
  const [leads, setLeads] = useState<Lead[]>([]);

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
  }, []);

  const reporters = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        leads: number;
        duplicates: number;
        goodLeads: number;
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
          goodLeads: 0,
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

      if (lead.status === "Appuntamento") {
        reporter.goodLeads += 1;
        reporter.score += 5;
      }

      if (lead.status === "Chiusa") {
        reporter.goodLeads += 1;
        reporter.score += 10;
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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/admin"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#1f4d8f",
              color: "white",
              fontWeight: 700,
            }}
          >
            Torna alle lead
          </Link>

          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#444",
              color: "white",
              fontWeight: 700,
            }}
          >
            Vai al login
          </Link>
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
          <div style={{ marginTop: 8 }}>Segnalazioni: {reporter.leads}</div>
          <div>Doppioni: {reporter.duplicates}</div>
          <div>Lead buone: {reporter.goodLeads}</div>
          <div><strong>Punteggio: {reporter.score}</strong></div>
        </div>
      ))}
    </main>
  );
}