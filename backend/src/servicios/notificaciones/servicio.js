// Envío de correos transaccionales vía Resend (https://resend.com). Usa la
// API HTTP directamente con fetch (Node 18+ ya la trae nativa) para no
// depender de un paquete npm nuevo — menos riesgo de romper el deploy por
// una dependencia faltante, mismo criterio que ya se usó en todo el resto
// del backend.
//
// Requiere la variable de entorno RESEND_API_KEY en Vercel. Mientras el
// dominio gestion-jacquin.com no esté verificado en Resend, el correo solo
// se puede mandar DESDE onboarding@resend.dev y HACIA el email con el que
// se creó la cuenta de Resend — es la limitación normal del modo de
// prueba, no un bug. Una vez verificado el dominio (Resend → Domains),
// definir RESEND_FROM como algo como
// "Academia Musical Jacquin <no-reply@gestion-jacquin.com>".

const RESEND_API_URL = "https://api.resend.com/emails";
const REMITENTE = process.env.RESEND_FROM || "Academia Musical Jacquin <onboarding@resend.dev>";
const URL_SISTEMA = process.env.URL_SISTEMA || "https://gestion-jacquin.com";

function plantillaBienvenida({ nombre, email, passwordTemporal }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #F3F2EE; padding: 32px 24px;">
    <div style="background: #223F61; border-radius: 10px 10px 0 0; padding: 20px 24px; text-align: center;">
      <p style="color: #fff; font-size: 20px; font-weight: 600; margin: 0; letter-spacing: 0.02em;">JACQUIN</p>
      <p style="color: #93B6EE; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; margin: 2px 0 0;">Academia Musical</p>
    </div>
    <div style="background: #ffffff; border-radius: 0 0 10px 10px; padding: 28px 24px;">
      <p style="color: #223F61; font-size: 16px; margin: 0 0 16px;">Hola ${nombre},</p>
      <p style="color: #223F61; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
        Se creó tu cuenta en el sistema de gestión de <strong>Academia Musical Jacquin</strong>. Estos son tus datos de acceso:
      </p>
      <div style="background: #F3F2EE; border-radius: 8px; padding: 14px 18px; margin: 0 0 20px;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #6b7686;">Email</p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #223F61; font-weight: 600;">${email}</p>
        <p style="margin: 0 0 6px; font-size: 13px; color: #6b7686;">Contraseña temporal</p>
        <p style="margin: 0; font-size: 14px; color: #223F61; font-weight: 600; font-family: monospace;">${passwordTemporal}</p>
      </div>
      <p style="color: #223F61; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        Por seguridad, el sistema te va a pedir que la cambiés por una de tu elección apenas inicies sesión por primera vez.
      </p>
      <div style="text-align: center; margin: 0 0 8px;">
        <a href="${URL_SISTEMA}" style="display: inline-block; background: #E78C3B; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">Entrar al sistema</a>
      </div>
      <p style="color: #6b7686; font-size: 12px; text-align: center; margin: 20px 0 0;">Si no esperabas este correo, podés ignorarlo.</p>
    </div>
  </div>`;
}

// Nunca lanza — si el correo falla, quien creó al usuario igual debe
// poder seguir usando el sistema (el alta ya se guardó en la base de
// datos antes de llegar acá). Devuelve { enviado, motivo } para que quien
// llama decida qué avisarle al Administrador.
export async function enviarCorreoBienvenida({ nombre, email, passwordTemporal }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY no está configurada — no se pudo enviar el correo de bienvenida.");
    return { enviado: false, motivo: "falta_api_key" };
  }
  try {
    const respuesta = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [email],
        subject: "Cambiá tu contraseña temporal — Academia Musical Jacquin",
        html: plantillaBienvenida({ nombre, email, passwordTemporal }),
      }),
    });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.text().catch(function () { return ""; });
      console.error("Resend respondió con error al enviar el correo de bienvenida:", respuesta.status, cuerpo);
      return { enviado: false, motivo: "error_resend" };
    }
    return { enviado: true };
  } catch (err) {
    console.error("No se pudo enviar el correo de bienvenida:", err.message);
    return { enviado: false, motivo: "error_conexion" };
  }
}
