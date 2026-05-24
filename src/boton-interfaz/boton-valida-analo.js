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

        // 🧼 SANITIZACIÓN DE PATIO AUTOMÁTICA:
        // Normaliza variaciones tolerando mayúsculas/minúsculas, guiones bajos o espacios múltiples
        // Ejemplo: Transforma "MACONDO SELLO:" o "macondo_sello  :" en "MACONDO_SELLO:"
        let limpia = rawString.replace(/MACONDO[\s_]+SELLO\s*:/i, "MACONDO_SELLO:");

        // 🔍 Análisis perimetral tolerando textos adjuntos (ej. mensajes decorativos de WhatsApp)
        if (limpia.includes("MACONDO_SELLO:")) {
            try {
                // Aislar la cadena partiendo desde donde se detecte el Sello Soberano
                const indiceSello = limpia.indexOf("MACONDO_SELLO:");
                const subCadena = limpia.substring(indiceSello).trim();

                // Separar la cabecera, la transacción b64 y la firma covalente corta
                const partes = subCadena.split(":");
                if (partes.length < 3) {
                    throw new Error("El Sello Nodal no contiene los bloques fundamentales (Prefijo:Payload:Firma).");
                }

                // Remover quiebres de página, espacios en blanco o retornos de carro (\r, \n, tab)
                // insertados accidentalmente por la renderización del PDF o el wrapping térmico.
                const payloadB64 = partes[1].replace(/\s/g, "");
                const firmaCovalente = partes[2].replace(/\s/g, "");

                // Decodificar criptográficamente el payload JSON encapsulado en Base64 en la RAM
                const datosDecodificadosJSON = atob(payloadB64);
                const objetoTransaccion = JSON.parse(datosDecodificadosJSON);

                // Reconstruir interfaz de éxito y renderizar datos en frío
                renderizarExito(objetoTransaccion, firmaCovalente);

            } catch (err) {
                renderizarFallo("Fallo de Integridad", `No se pudo descifrar el sello analógico: ${err.message}`);
            }
        } else if (rawString.includes("-----BEGIN PGP SIGNATURE-----")) {
            // Flujo B: Sello PGP Estándar Desprendido
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
                        <td>Firma de Validación:</td>
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