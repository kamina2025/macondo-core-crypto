/**
 * PROYECTO MACONDO - LÓGICA DE FORJA SOBERANA
 * Manejo de datos del perfil técnico, méritos y empaquetado del JSON inicial.
 */
import { MacondoCrypto } from "./macondo-crypto.js?v=999";

export const ForjaLogica = {
    /**
     * Reúne los datos de la interfaz y estructura la cédula evolutiva con el rango "Iniciado".
     */
    async procesarRito(alias, pass, previewElement) {
        if (!alias || pass.length < 8) {
            alert("🔴 Error: El alias no puede estar vacío y la frase de acceso debe tener mínimo 8 caracteres.");
            return;
        }

        previewElement.value = "⏳ Forjando llaves elípticas Ed25519 de forma local y soberana...\nPor favor, espera un momento.";

        try {
            // 1. Forja de llaves en la memoria RAM
            const llaves = await MacondoCrypto.forjarIdentidad(alias, pass);

            // 2. Extracción de variables de infraestructura opcionales de la interfaz (o valores por defecto)
            const hardwareNodo = document.getElementById("hardwareNodo")?.value.trim() || "Nodo Portátil / Genérico";
            const almacenamientoGB = parseInt(document.getElementById("almacenamientoGB")?.value) || 10;
            const aporteMaterial = document.getElementById("aporteMaterial")?.value || "Ninguno / Soporte de Red";

            // 3. Estructuración del Perfil Anti-Calzada (Basado en aportes y capacidades físicas)
            const cedulaNodal = {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "title": "CedulaNodalEvolutiva",
                "version": "2.0.0",
                "metadata": {
                    "alias_custodio": alias,
                    "rango_actual": "Iniciado",
                    "generacion_actual": 1
                },
                "certificado_actual": {
                    "fecha_forja": new Date().toISOString(),
                    "pgp_public_key": llaves.publicKey,
                    "pgp_encrypted_private_key": llaves.encryptedPrivateKey
                },
                "perfil_tecnico_soberano": {
                    "infraestructura_nodo": hardwareNodo,
                    "protocolos_activos": ["WebTorrent", "PGP"],
                    "almacenamiento_asignado_gb": almacenamientoGB
                },
                "matriz_acceso_artefactos": {
                    "sinfonia": { "rol": "Iniciado", "puede_subir_magnet_links": false },
                    "boveda": { "nivel_acceso": "Nivel_1_Lectura", "llaves_ofuscadas": false }
                },
                "registro_meritos_termodinamicos": {
                    "aporte_principal": aporteMaterial,
                    "puntos_contribucion": 0,
                    "ultimo_hash_consenso": "0x0000000000000000000000000000000000000000"
                },
                "linaje_generacional": [],
                "autorizaciones": {
                    "firma_oficial_validador": ""
                }
            };

            // 4. Previsualización en el área de texto
            const jsonString = JSON.stringify(cedulaNodal, null, 2);
            previewElement.value = jsonString;

            // 5. Disparar descarga local soberana
            this.descargarJSON(jsonString, `cedula_${alias}_iniciado.json`);
            console.log(`🟢 Cédula forjada y descargada con éxito para el nodo: ${alias}`);

        } catch (err) {
            previewElement.value = `❌ Ocurrió un error en la forja criptográfica:\n${err.message}`;
            console.error(err);
        }
    },

    /**
     * Utiliza blobs del navegador para guardar el archivo localmente sin tocar internet.
     */
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