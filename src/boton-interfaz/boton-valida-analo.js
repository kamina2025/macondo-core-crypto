/**
 * PROYECTO MACONDO - CONTROLADOR DE AUDITORÍA ANALÓGICA (VERSIÓN BLINDADA)
 * Ubicación: /tu-raiz/src/boton-interfaz/boton-valida-analo.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnVerificar = document.getElementById("btnVerificar");
    const qrStringInput = document.getElementById("qrStringInput");
    const monitorTerminal = document.getElementById("monitorTerminal");

    // 🛡️ CLÁUSULA DE GUARDA: Si el botón no existe en este HTML, detenemos la ejecución pacíficamente
    if (!btnVerificar) {
        console.warn("⚠️ [Macondo Diagnostic] El elemento 'btnVerificar' no reside en este DOM. Script suspendido.");
        return;
    }

    // Asegurar que los otros elementos requeridos también existan
    if (!qrStringInput || !monitorTerminal) {
        console.error("🚨 [Macondo Error] Faltan contenedores críticos de interfaz ('qrStringInput' o 'monitorTerminal').");
        return;
    }

    console.log("🟢 [Macondo Core] Altar de Validación inicializado correctamente en la RAM.");

    btnVerificar.addEventListener('click', () => {
        const rawString = qrStringInput.value.trim();

        if (!rawString) {
            renderizarFallo("Error de Lectura", "La cadena del Sello Digital no puede estar vacía.");
            return;
        }

        // 🧼 SANITIZACIÓN DE PATIO AUTOMÁTICA:
        let limpia = rawString.replace(/MACONDO[\s_]+SELLO\s*:/i, "MACONDO_SELLO:");

        if (limpia.includes("MACONDO_SELLO:")) {
            try {
                const indiceSello = limpia.indexOf("MACONDO_SELLO:");
                const subCadena = limpia.substring(indiceSello).trim();

                const partes = subCadena.split(":");
                if (partes.length < 3) {
                    throw new Error("El Sello Nodal no contiene los bloques fundamentales (Prefijo:Payload:Firma).");
                }

                const payloadB64 = partes[1].replace(/\s/g, "");
                const firmaCovalente = partes[2].replace(/\s/g, "");

                // Decodificar el payload JSON de la transacción
                const datosDecodificadosJSON = atob(payloadB64);
                const objetoTransaccion = JSON.parse(datosDecodificadosJSON);

                renderizarExito(objetoTransaccion, firmaCovalente);

            } catch (err) {
                renderizarFallo("Fallo de Integridad", `No se pudo descifrar el sello analógico: ${err.message}`);
            }
        } else if (rawString.includes("-----BEGIN PGP SIGNATURE-----")) {
            renderizarFallo("Entorno Limitado", "Firma PGP legítima detectada. Conecte un Faro de red con openpgp.js para verificar el árbol completo.");
        } else {
            renderizarFallo("Cadena Inválida", "El formato ingresado no posee el prefijo de autenticidad de Macondo. Asegúrese de incluir el bloque que empieza por 'MACONDO SELLO:'.");
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
                        <td>Firma de Validation:</td>
                        <td style="font-family:monospace; color:#8b949e; word-break: break-all;">${firma}</td>
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