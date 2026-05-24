/**
 * PROYECTO MACONDO - LÓGICA DEL ALTAR DE ASCENSO
 * Manejo de linajes generacionales, firmas cruzadas PGP y mutación de perfiles.
 */
import { MacondoCrypto } from "./macondo-crypto.js?v=999";

export const AscenderLogica = {
    /**
     * Procesa la lectura de archivos JSON locales de forma segura.
     */
    leerArchivoJson(file, callbackExito, callbackError) {
        const lector = new FileReader();
        lector.onload = (evento) => {
            try {
                const jsonParsed = JSON.parse(evento.target.result);
                // Validación básica de estructura Macondo
                if (!jsonParsed.metadata || !jsonParsed.certificado_actual) {
                    throw new Error("El archivo no cumple con el estándar de Cédula Nodal.");
                }
                callbackExito(jsonParsed);
            } catch (err) {
                callbackError("El archivo seleccionado no es un JSON válido de Macondo.");
            }
        };
        lector.readAsText(file);
    },

    /**
     * FUNCIÓN AUXILIAR: Genera el sello comercial necesario para que la Mesa Mercante
     * no rechace la nueva cédula evolucionada por inconsistencia de metadatos.
     */
    generarSelloSeguridad(certificado) {
        const alias = certificado.metadata?.alias_custodio || "anonimo";
        const puntos = certificado.registro_meritos_termodinamicos?.puntos_redencion || 0;
        const subCadenaClave = certificado.certificado_actual?.pgp_public_key?.substring(30, 60) || "MACONDO_KEY";
        const payloadSello = `${alias}|${puntos}|${subCadenaClave}`;
        return btoa(payloadSello).substring(0, 32);
    },

    /**
     * Transiciona el linaje, ejecuta la firma PGP desprendida y descarga la cédula mutada.
     * Modificada para acoplarse con el callback de la interfaz y el sellado de puntos.
     */
    async ejecutarAscenso(datosIniciado, datosValidador, claveValidador, logFn, callbackDescarga) {
        logFn("Iniciando transición de linaje criptográfico... Procesando en RAM.");

        try {
            // 1. Preparar el manifiesto de traspaso generacional que la autoridad va a certificar
            const manifiestoAscenso = {
                aspirante: datosIniciado.metadata.alias_custodio,
                nuevo_rango: "Aprendiz",
                generacion_origen: datosIniciado.metadata.generacion_actual,
                llave_publica_aspirante: datosIniciado.certificado_actual.pgp_public_key,
                autorizador: datosValidador.metadata.alias_custodio,
                rango_autorizador: datosValidador.metadata.rango_actual,
                fecha_firmado: new Date().toISOString()
            };

            const textoA_Firmar = JSON.stringify(manifiestoAscenso);

            // 2. Desencriptar llave privada del Oficial/Maestro y estampar firma digital desprendida
            logFn("🔒 Desencriptando llave del validador y aplicando firma PGP desprendida...");
            const firmaGeneracional = await MacondoCrypto.firmarAccion(
                textoA_Firmar,
                datosValidador.certificado_actual.pgp_encrypted_private_key,
                claveValidador
            );

            // 3. Clonación limpia para mutar al Iniciado en Aprendiz (Generación 2)
            const nuevaCedulaAprendiz = JSON.parse(JSON.stringify(datosIniciado));

            // Archivar el estado anterior en el historial histórico de linajes pasados
            const eslabonHistorico = {
                generacion: datosIniciado.metadata.generacion_actual,
                rango: datosIniciado.metadata.rango_actual,
                fecha_forja: datosIniciado.certificado_actual.fecha_forja,
                pgp_public_key: datosIniciado.certificado_actual.pgp_public_key,
                firma_de_ascenso: datosIniciado.autorizaciones?.firma_oficial_validador || "Auto-forjada al inicio"
            };

            // Mutación de metadatos de rango
            nuevaCedulaAprendiz.metadata.rango_actual = "Aprendiz";
            nuevaCedulaAprendiz.metadata.generacion_actual = 2;
            nuevaCedulaAprendiz.certificado_actual.fecha_forja = manifiestoAscenso.fecha_firmado;

            // Inyección automática de la evolución de accesos a artefactos para Aprendices
            nuevaCedulaAprendiz.matriz_acceso_artefactos = {
                sinfonia: { "rol": "Aprendiz_Operador", "puede_subir_magnet_links": true },
                boveda: { "nivel_acceso": "Nivel_2_Comunitario", "llaves_ofuscadas": true }
            };

            // Almacenar las firmas en la red de confianza e historial
            if (!nuevaCedulaAprendiz.autorizaciones) nuevaCedulaAprendiz.autorizaciones = {};
            nuevaCedulaAprendiz.autorizaciones.firma_oficial_validador = firmaGeneracional;
            
            if (!nuevaCedulaAprendiz.linaje_generacional) nuevaCedulaAprendiz.linaje_generacional = [];
            nuevaCedulaAprendiz.linaje_generacional.push(eslabonHistorico);

            // BLINDAJE DE INTEGRIDAD: Re-sellamos el monedero para que asimile los nuevos metadatos de rango
            if (!nuevaCedulaAprendiz.registro_meritos_termodinamicos) nuevaCedulaAprendiz.registro_meritos_termodinamicos = {};
            nuevaCedulaAprendiz.registro_meritos_termodinamicos.ultimo_hash_consenso = this.generarSelloSeguridad(nuevaCedulaAprendiz);

            logFn("🟢 [ÉXITO CRIPTOGRÁFICO] Ascenso firmado. Preparando descarga del nuevo archivo...");

            // 4. Descargar el nuevo certificado evolutivo de forma local usando tu método nativo
            this.descargarJSON(
                JSON.stringify(nuevaCedulaAprendiz, null, 2), 
                `cedula_${nuevaCedulaAprendiz.metadata.alias_custodio}_aprendiz.json`
            );

            // 5. Si la interfaz visual requiere ejecutar lógica extra post-descarga, disparamos el callback
            if (typeof callbackDescarga === "function") {
                callbackDescarga(nuevaCedulaAprendiz);
            }

            logFn("🟢 Proceso culminado. Cédula evolutiva de Rango Aprendiz descargada de forma segura.");

        } catch (error) {
            logFn(`Fallo en el rito de firma: ${error.message}`, true);
        }
    },

    descargarJSON(jsonString, nombreArchivo) {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};