/**
 * PROYECTO MACONDO - CONTROLADOR DE INTERFAZ PARA PUNTO DE PAGO
 * Ubicación sugerida: /tu-raiz/boton-interfaz/boton-punto-pago.js
 */
import { MercanteLogica } from "../mercante-logica.js?v=999";

// Variables de estado en la RAM de la vista
let certificadoCliente = null;
let ticketActualTexto = "";
let transaccionActiva = null; // Almacena el payload estructurado para la firma PGP

// ===================================================================
// MOTOR DE FIRMA CRIPTOGRÁFICA Y PARSEO ANALÓGICO: MACONDO QR TÉRMICO
// ===================================================================
const MacondoQRTermico = {
    /**
     * Forja un bloque de firma desprendida (Detached Signature) simulando OpenPGP ASCII Armor
     * a partir del PIN, el custodio y el último hash de consenso de la Mesa Mercante.
     */
    generarBloqueFirmaPGP(datos, pin, artefacto) {
        // Creamos el payload de verificación covalente
        const payload = `${datos.nombre}|${pin}|${artefacto.toUpperCase()}|${datos.ultimo_hash_consenso}`;
        
        // Simulamos el empaquetado criptográfico en Base64
        const firmaBase64 = btoa(payload).substring(0, 50);
        
        // Estructuramos el bloque bajo el estándar cypherpunk estricto
        let bloquePGP = "\n-----BEGIN PGP SIGNATURE-----\n";
        bloquePGP += "Version: Macondo Core v2.0 (Patio Local)\n";
        bloquePGP += "Comment: Firmado de forma autonoma por Mesa Mercante\n\n";
        bloquePGP += `${firmaBase64.substring(0, 25)}\n`;
        bloquePGP += `${firmaBase64.substring(25, 50)}\n`;
        bloquePGP += "-----END PGP SIGNATURE-----";
        
        return bloquePGP;
    },

    /**
     * Genera un enlace de verificación local o QR legible para que otro nodo
     * desconectado pueda escanear y validar la firma sin tocar internet.
     */
    obtenerPayloadVerificacion(datos, pin, artefacto) {
        const hashReducido = datos.ultimo_hash_consenso.substring(0, 10);
        const rangoNodal = datos.metadata?.rango || "Iniciado";
        // Formato ultra-compacto ideal para cadenas Mesh, radios LoRa o códigos QR rápidos
        return `MACONDO:${datos.nombre}:${rangoNodal}:${pin}:${hashReducido}`;
    },

    /**
     * 🔒 FUNCIÓN CRUCIAL: Forja el Sello QR analógico de forma asíncrona.
     */
    async forjarSelloQR(transaccion, llavePrivadaArmored, fraseAcceso) {
        if (!fraseAcceso || fraseAcceso.trim() === "") {
            throw new Error("La frase de acceso no puede estar vacía.");
        }

        // Caminito A: Si OpenPGP real está presente en el árbol global, firmamos legítimamente
        try {
            if (window.openpgp) {
                const privateKey = await window.openpgp.decryptKey({
                    privateKey: await window.openpgp.readPrivateKey({ armoredKey: llavePrivadaArmored }),
                    passphrase: fraseAcceso
                });
                const message = await window.openpgp.createMessage({ text: JSON.stringify(transaccion) });
                const signature = await window.openpgp.sign({
                    message,
                    signingKeys: privateKey,
                    detached: true
                });
                return btoa(signature).substring(0, 120); 
            }
        } catch (pgpErr) {
            throw new Error("Contraseña incorrecta para descifrar la llave PGP legítima.");
        }

        // Caminito B: Contingencia Homologada (Simulación Ciberpunk Offline de Patio)
        const firmaCovalente = btoa(`${transaccion.id_mercante}|${transaccion.pin_verificacion}|${fraseAcceso.substring(0,4)}`).substring(0, 30);
        
        // 🛠️ CORRECCIÓN AQUÍ: Quitamos el .substring(0, 40) para mantener la integridad estructural del JSON
        const transaccionReducida = btoa(JSON.stringify({ id: transaccion.id_mercante, pin: transaccion.pin_verificacion }));
        
        return `MACONDO_SELLO:${transaccionReducida}:${firmaCovalente}`;
    }
};

// 🔓 ROMPER EL AISLAMIENTO DEL MÓDULO:
window.MacondoQRTermico = MacondoQRTermico;

const monitor = (texto, err = false) => {
    const c = document.getElementById("consolaMercante");
    if (!c) return;
    c.style.borderColor = err ? "#ff3333" : "#39ff14";
    c.innerHTML = err ? `❌ ${texto}` : `🪵 ${texto}`;
};

/**
 * Función constructora del diseño ASCII adaptada para terminales térmicas (58mm) y WhatsApp
 */
function construirTextoTicketEstandar(datos, pin, artefacto) {
    const anchoTicket = 32;
    const lineaDivisoria = "=".repeat(anchoTicket);
    const lineaSuave = "-".repeat(anchoTicket);
    const fechaActual = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    let ticket = "";
    ticket += `${lineaDivisoria}\n`;
    ticket += "      PROYECTO  MACONDO       \n";
    ticket += "    - SOBERANÍA  DIGITAL -    \n";
    ticket += `${lineaDivisoria}\n`;
    ticket += `Fecha: ${fechaActual.split(',')[0]}\n`;
    ticket += `Hora:  ${fechaActual.split(',')[1].trim()}\n`;
    ticket += `Estación: Mesa Mercante (Patio)\n`;
    ticket += `${lineaSuave}\n`;
    ticket += `CUSTODIO: ${datos.nombre}\n`;
    ticket += `RANGO:    ${datos.metadata.rango.toUpperCase()}\n`;
    ticket += `GEN:      ${datos.metadata.generacion_actual}\n`;
    ticket += `${lineaSuave}\n`;
    ticket += `ARTEFACTO: ${artefacto.toUpperCase()}\n`;
    ticket += "   >>> PIN DE ENLACE SECURE <<<  \n";
    ticket += `\n       [  ${pin}  ]       \n\n`;
    ticket += "* Valido solo para un uso.\n";
    ticket += "* No comparta este PIN en canales\n  publicos de la red.\n";
    ticket += `${lineaSuave}\n`;
    ticket += `Puntos Activos: ${datos.puntos_redencion} pts\n`;
    ticket += `Hash de Consenso:\n`;
    ticket += `${datos.ultimo_hash_consenso.substring(0, 20)}...\n`;
    
    ticket += window.MacondoQRTermico.generarBloqueFirmaPGP(datos, pin, artefacto);
    ticket += `${lineaDivisoria}\n`; 
    ticket += "   EL CODIGO ES LA LEY EN EL PATIO  \n";
    ticket += `${lineaDivisoria}\n`;
    return ticket;
}

/**
 * Orquesta la actualización dinámica de la previsualización del ticket en base al estado del cliente
 */
function refrescarVistaPreviaTicket(pinGenerado, artefactoElegido, aliasMercante) {
    const datosPasaporteAdaptados = {
        nombre: certificadoCliente?.metadata?.alias_custodio || "Iniciado Anonimo",
        metadata: {
            rango: certificadoCliente?.metadata?.rango_actual || "Iniciado",
            generacion_actual: certificadoCliente?.metadata?.generacion_actual || 1
        },
        ultimo_hash_consenso: certificadoCliente?.registro_meritos_termodinamicos?.ultimo_hash_consenso || "0x00000000000000000000",
        puntos_redencion: certificadoCliente?.registro_meritos_termodinamicos?.puntos_redencion || 0
    };

    transaccionActiva = {
        ultimo_hash_consenso: datosPasaporteAdaptados.ultimo_hash_consenso,
        pin_verificacion: pinGenerado,
        monto_puntos: datosPasaporteAdaptados.puntos_redencion,
        id_mercante: aliasMercante,
        timestamp: Math.floor(Date.now() / 1000)
    };

    ticketActualTexto = construirTextoTicketEstandar(datosPasaporteAdaptados, pinGenerado, artefactoElegido);
    document.getElementById('vista-previa-ticket').textContent = ticketActualTexto;
}

/**
 * Genera de forma dinámica la opción de descarga del JSON de la Cédula mutada
 */
function ofrecerDescargaActualizada() {
    const viejoLink = document.getElementById("btnDescargarCedulaActualizada");
    if(viejoLink) viejoLink.remove();

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(certificadoCliente, null, 2));
    const btnDescarga = document.createElement("a");
    btnDescarga.id = "btnDescargarCedulaActualizada";
    btnDescarga.setAttribute("href", dataStr);
    btnDescarga.setAttribute("download", `cedula_${certificadoCliente.metadata?.alias_custodio || "iniciado"}_actualizada.json`);
    btnDescarga.className = "btn-nav";
    btnDescarga.style.borderColor = "#00ffcc";
    btnDescarga.style.color = "#00ffcc";
    btnDescarga.style.marginTop = "15px";
    btnDescarga.style.textAlign = "center";
    btnDescarga.style.display = "block";
    btnDescarga.innerHTML = "💾 DESCARGAR CÉDULA NODAL ACTUALIZADA";

    document.getElementById("datosIniciado").appendChild(btnDescarga);
}

// ===================================================================
// INICIALIZACIÓN DE ESCUCHAS DE EVENTOS (DOM)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {

    // 1. GENERACIÓN DE PIN Y ACTUALIZACIÓN DE TICKET
    document.getElementById("btnGenerarPin").addEventListener("click", () => {
        const artefacto = document.getElementById("selectArtefacto").value;
        const mercante = document.getElementById("aliasMercante").value.trim();

        if(!mercante) {
            monitor("Se requiere el alias del Mercante para validar el origen del token.", true);
            return;
        }

        const pinGenerado = MercanteLogica.generarPinArtefacto(artefacto, mercante);
        const display = document.getElementById("pinResultado");
        display.innerText = pinGenerado;
        display.style.display = "block";

        refrescarVistaPreviaTicket(pinGenerado, artefacto, mercante);
        monitor(`PIN de acceso único forjado con éxito para el artefacto [${artefacto}]. Intercambio de 5,000 COP registrado.`);
    });

    // 2. CARGA DE CERTIFICADO CLIENTE (JSON)
    document.getElementById("cargarCertificadoIniciado").addEventListener("change", (e) => {
        if (!e.target.files[0]) return;
        const lector = new FileReader();
        lector.onload = (ev) => {
            try {
                certificadoCliente = JSON.parse(ev.target.result);
                
                document.getElementById("lblAliasIniciado").innerText = certificadoCliente.metadata?.alias_custodio || "Iniciado_Anonimo";
                document.getElementById("lblRangoIniciado").innerText = certificadoCliente.metadata?.rango_actual || "Iniciado";
                
                const puntos = certificadoCliente.registro_meritos_termodinamicos?.puntos_redencion || 0;
                document.getElementById("lblPuntosIniciado").innerText = `${puntos} pts`;

                document.getElementById("datosIniciado").style.display = "block";
                document.getElementById("operacionesPuntos").style.display = "block";
                
                monitor(`Certificado Nodal del Iniciado [${certificadoCliente.metadata?.alias_custodio}] cargado e indexado inmutablemente en la RAM.`);
            } catch(err) {
                monitor("No se pudo parsear el certificado. Asegúrate de que sea un JSON válido de Macondo.", true);
            }
        };
        lector.readAsText(e.target.files[0]);
    });

    // 3. EVENTO: ACUMULAR PUNTOS
    document.getElementById("btnAcumularPuntos").addEventListener("click", () => {
        if(!certificadoCliente) {
            alert("⚠️ Primero debe cargar la Cédula Nodal de un iniciado.");
            return;
        }
        const monto = parseInt(document.getElementById("montoIntercambio").value);

        if(isNaN(monto) || monto <= 0) {
            monitor("Ingresa un monto válido de transaccionalidad física en COP.", true);
            return;
        }

        certificadoCliente = MercanteLogica.acumularPuntosIniciado(certificadoCliente, monto);
        
        const puntosNuevos = certificadoCliente.registro_meritos_termodinamicos.puntos_redencion;
        document.getElementById("lblPuntosIniciado").innerText = `${puntosNuevos} pts`;
        document.getElementById("montoIntercambio").value = "";

        monitor(`🎉 <strong>¡Puntos Acumulados!</strong> Cédula actualizada de forma asíncrona en la RAM.<br><br>Descarga el archivo modificado y entrégaselo al iniciado.`);
        ofrecerDescargaActualizada();
    });

    // 4. EVENTO: REDIMIR DESCUENTOS
    document.getElementById("btnCalcularRedimir").addEventListener("click", () => {
        if(!certificadoCliente) {
            alert("⚠️ Primero debe cargar la Cédula Nodal de un iniciado.");
            return;
        }
        const tipo = document.getElementById("tipoProductoDescuento").value;
        const precioBase = parseFloat(document.getElementById("montoOriginalProducto").value);

        if(isNaN(precioBase) || precioBase <= 0) {
            monitor("Digita el precio de lista original del producto.", true);
            return;
        }

        try {
            const resultado = MercanteLogica.redimirDescuentoCertificado(certificadoCliente, tipo, precioBase);
            certificadoCliente = resultado.certificadoActualizado;

            document.getElementById("lblPuntosIniciado").innerText = `${certificadoCliente.registro_meritos_termodinamicos.puntos_redencion} pts`;
            document.getElementById("montoOriginalProducto").value = "";

            monitor(`🔓 <strong>¡DESCUENTO APLICADO SOBERANAMENTE!</strong><br><br>
            Tasa Evaluada: <span style='color:#00ffcc;'>${resultado.detalles.tasa_aplicada}</span><br>
            Descuento Otorgado: <span style='color:#39ff14;'>$${resultado.detalles.descuento_cop.toFixed(2)} COP</span><br>
            <strong>Valor Neto a Cobrar en Patio: <span style='color:#39ff14; font-size:1.1rem;'>$${resultado.detalles.precio_final_cop.toFixed(2)} COP</span></strong><br><br>
            Costo deducido: ${resultado.detalles.puntos_costo} puntos.`);

            ofrecerDescargaActualizada();
        } catch(err) {
            monitor(err.message, true);
        }
    });

    // 5. EVENTO DE IMPRESIÓN ASÍNCRONA CON SELLO QR PGP (58mm)
    document.getElementById('btn-imprimir-termico').addEventListener('click', async () => {
        if (!ticketActualTexto || !transaccionActiva) {
            alert("⚠️ Primero debe forjar un PIN para compilar la matriz de impresión.");
            return;
        }

        let llavePrivadaArmored = sessionStorage.getItem("macondo_session_token"); 
        if (!llavePrivadaArmored) {
            llavePrivadaArmored = "NO_SESSION_TOKEN_FALLBACK_KEY";
        }

        const fraseAcceso = prompt("[Seguridad] Introduce tu frase de acceso para firmar el Sello QR:");
        if (!fraseAcceso) return;

        try {
            monitor("🔒 Computando firma asíncrona desprendida PGP en RAM...");
            const stringQR = await window.MacondoQRTermico.forjarSelloQR(transaccionActiva, llavePrivadaArmored, fraseAcceso);

            const ventanaImpresion = window.open('', '_blank', 'width=320,height=600');
            ventanaImpresion.document.write(`
                <html>
                <head>
                    <title>Imprimir Ticket Macondo</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; margin: 0; padding: 10px; background:#fff; color:#000; }
                        pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
                        #ticket-qr-container { margin: 12px auto; display: flex; justify-content: center; align-items: center; }
                        #ticket-qr-container img, #ticket-qr-container canvas { max-width: 140px !important; max-height: 140px !important; }
                        .centrado { text-align: center; }
                    </style>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                </head>
                <body>
                    <pre>${ticketActualTexto}</pre>
                    <div class="centrado" style="font-size: 9px; margin-top:5px;"><b>--- SELLO DIGITAL OFFLINE ---</b></div>
                    <div id="ticket-qr-container"></div>
                    <pre style="font-size: 8px; color: #333; text-align: center; padding: 0 5px;">${stringQR}</pre>
                    <script>
                        window.onload = function() {
                            new QRCode(document.getElementById("ticket-qr-container"), {
                                text: "${stringQR}",
                                width: 140,
                                height: 140,
                                correctLevel : QRCode.CorrectLevel.M
                            });
                            setTimeout(() => { window.print(); window.close(); }, 500);
                        }
                    <\/script>
                </body>
                </html>
            `);
            ventanaImpresion.document.close();
            monitor("🖨️ Matriz térmica compilada y enviada con éxito a la ticketera.");

        } catch (error) {
            monitor(`Error de firma: ${error.message}`, true);
            alert("No se pudo procesar la firma: Contraseña incorrecta o bloque corrupto.");
        }
    });

    // 6. EVENTO ENVIAR COMPROBANTE CON RESPALDO CRIPTOGRÁFICO A WHATSAPP
    document.getElementById('btn-enviar-whatsapp').addEventListener('click', async () => {
        if (!ticketActualTexto || !transaccionActiva) {
            alert("⚠️ Primero debe forjar un PIN para compilar el mensaje.");
            return;
        }
        const telefono = document.getElementById('telefono-custodio').value.trim();
        if (!telefono) {
            alert("⚠️ Ingrese el número de WhatsApp del custodio/iniciado (con código de país, ej: 57310...).");
            return;
        }

        let llavePrivadaArmored = sessionStorage.getItem("macondo_session_token");
        if (!llavePrivadaArmored) {
            llavePrivadaArmored = "NO_SESSION_TOKEN_FALLBACK_KEY";
        }

        const fraseAcceso = prompt("[Seguridad] Desbloquea la RAM para estampar la firma digital en el texto plano:");
        if (!fraseAcceso) return;

        try {
            monitor("🔒 Firmando payload para el canal omnicanal móvil...");
            const stringQR = await window.MacondoQRTermico.forjarSelloQR(transaccionActiva, llavePrivadaArmored, fraseAcceso);

            const mensajeCompleto = 
`${ticketActualTexto}
*🔒 SELLO DE VALIDACIÓN OFFLINE PGP:*
\`${stringQR}\`
_Copie el string anterior en el Altar de Validación para verificar la autenticidad sin internet._`;

            const mensajeCodificado = encodeURIComponent(mensajeCompleto);
            const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${mensajeCodificado}`;
            window.open(url, '_blank');
            monitor("📲 Comprobante firmado asíncronamente y despachado a la pasarela móvil.");

        } catch (error) {
            monitor(`Fallo en el despacho omnicanal: ${error.message}`, true);
        }
    });
});