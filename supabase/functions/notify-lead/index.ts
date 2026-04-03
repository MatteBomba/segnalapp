import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    const {
      reporterName,
      reporterPhone,
      owner,
      phone,
      city,
      note,
    } = body;

    const { error } = await resend.emails.send({
      from: "Segnalapp <onboarding@resend.dev>",
      to: ["bombardellimatteo94@gmail.com"],
      subject: "📩 Nuova segnalazione ricevuta",
      html: `
        <h2>Nuova segnalazione</h2>
        <p><strong>Segnalatore:</strong> ${reporterName || "-"}</p>
        <p><strong>Tel segnalatore:</strong> ${reporterPhone || "-"}</p>
        <p><strong>Proprietario:</strong> ${owner || "-"}</p>
        <p><strong>Telefono:</strong> ${phone || "-"}</p>
        <p><strong>Città:</strong> ${city || "-"}</p>
        <p><strong>Note:</strong> ${note || "-"}</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});