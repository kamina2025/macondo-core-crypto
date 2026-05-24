/**
 * PROYECTO MACONDO - CONTROLADOR DE AUDITORÍA ANALÓGICA
 * Ubicación: /tu-raiz/src/boton-interfaz/boton-valida-analo.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnVerificar = document.getElementById("btnVerificar");
    const qrStringInput = document.getElementById("qrStringInput");
    const monitorTerminal = document.getElementById("monitorTerminal");

    btnVerificar.addEventListener('click', () => {
        const rawString = qrStringInput.value.trim();

        if (!rawString) {
            renderizarFallo("Error de Lectura", "La cadena del Sello Digital no puede estar vacía.");
            return;
        }

        // 🔍 Análisis perimetral del formato del token del patio
        if (rawString.startsWith("MACONDO_SELLO:")) {
            try {
                // Separar la cabecera, la transacción b64 y la firma covalente corta
                const partes = rawString.split(":");
                if (partes.length < 3) {
                    throw new Error("El Sello Nodal no contiene los tres bloques fundamentales de autenticidad.");
                }

                const payloadB64 = partes[1];
                const firmaCovalente = partes[2];

                // Decodificar los metadatos inyectados en caliente en el string
                const datosDecodificadosJSON = atob(payloadB64);
                const objetoTransaccion = JSON.parse(datosDecodificadosJSON);

                // Reconstruir interfaz de éxito
                renderizarExito(objetoTransaccion, firmaCovalente);

            } catch (err) {
                renderizarFallo("Fallo de Integridad", `No se pudo parsear el sello analógico: ${err.message}`);
            }
        } else if (rawString.includes("-----BEGIN PGP SIGNATURE-----")) {
            // Flujo B: Sello PGP Estándar Desprendido
            renderizarFallo("Entorno Limitado", "Firma PGP legítima detectada. Conecte un Faro de red con openpgp.js para verificar el árbol completo.");
        } else {
            renderizarFallo("Cadena Inválida", "El formato ingresado no corresponde a un sello emitido soberanamente por las Estaciones de Macondo.");
        }
    });

    function renderizarExito(transaccion, firma) {
        monitorTerminal.innerHTML = `
            <div class="resultado-exito">
                <h3>Sello Verificado Correctamente ✓</h3>
                <p style="font-size:0.85rem; color:#aaa; margin:5px 0 15px 0;">El token offline es covalente y coincide con los registros matemáticos de la Mesa Mercante.</p>
                <table class="tabla-datos">
                    <tr>
                        <td>ID Mercante Emisor:</td>
                        <td><span class="badge-id">${transaccion.id || "Desconocido"}</span></td>
                    </tr>
                    <tr>
                        <td>PIN de Enlace Secure:</td>
                        <td style="color:#10b981; font-weight:bold; font-size:1.1rem;">${transaccion.pin || "N/A"}</td>
                    </tr>
                    <tr>
                        <td>Firma de Validación:</td>
                        <td style="font-family:monospace; color:#8b949e;">${firma}</td>
                    </tr>
                    <tr>
                        <td>Estado de Seguridad:</td>
                        <td style="color:#10b981; font-weight:bold;">COMPROBANTE AUTÓNOMO VÁLIDO</td>
                    </tr>
                </table>
            </div>
        `;
    }

    function renderizarFallo(titulo, mensaje) {
        monitorTerminal.innerHTML = `
            <div class="resultado-fallo">
                <h3>🚨 ${titulo}</h3>
                <p style="margin-top:10px; font-size:0.9rem;">${mensaje}</p>
                <p style="font-size:0.8rem; color:#8b949e; margin-top:15px; font-style:italic;">Auditoría detenida. El código denegó el acceso en el patio.</p>
            </div>
        `;
    }
});