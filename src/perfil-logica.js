/**
 * PROYECTO MACONDO - VISTA Y FORJA DEL PERFIL SOBERANO
 * Lógica para visualizar atributos, méritos y forjar identidades iniciales.
 */
import { MacondoCrypto } from "./macondo-crypto.js?v=999";

export const PerfilLogica = {
    /**
     * Lee una cédula JSON existente y mapea sus datos físicos y criptográficos en la interfaz.
     */
    cargarPerfilVisual(json, inputs) {
        if (inputs.alias) inputs.alias.value = json.metadata?.alias_custodio || "";
        if (inputs.hardware) inputs.hardware.value = json.perfil_tecnico_soberano?.infraestructura_nodo || "";
        if (inputs.almacenamiento) inputs.almacenamiento.value = json.perfil_tecnico_soberano?.almacenamiento_asignado_gb || "";
        if (inputs.aporte) inputs.aporte.value = json.registro_meritos_termodinamicos?.aporte_principal || "";
        
        // Renderizado del bloque de estatus de rango y méritos en la interfaz
        if (inputs.statusBox) {
            inputs.statusBox.style.display = "block";
            inputs.statusBox.innerHTML = `
                <strong>[ RANGO ACTUAL ]:</strong> ${json.metadata?.rango_actual || "Desconocido"}<br>
                <strong>[ LINAJE GENERACIÓN ]:</strong> Gen ${json.metadata?.generacion_actual || 1}<br>
                <strong>[ PUNTOS DE CONTRIBUCIÓN ]:</strong> ${json.registro_meritos_termodinamicos?.puntos_contribucion || 0} PM<br>
                <strong>[ SINFONÍA ]:</strong> ${json.matriz_acceso_artefactos?.sinfonia?.rol || "Ninguno"}<br>
                <strong>[ BÓVEDA ]:</strong> ${json.matriz_acceso_artefactos?.boveda?.nivel_acceso || "Sin Acceso"}
            `;
        }
    },

    /**
     * Ejecuta el rito de forja base (Iniciado) integrando los nuevos campos estructurados.
     */
    async ejecutarForjaBase(alias, pass, datosFisicos, previewElement, statusBox) {
        if (!alias || pass.length < 8) {
            alert("🔴 Error: El alias no puede estar vacío y la frase de acceso debe tener mínimo 8 caracteres.");
            return;
        }

        previewElement.value = "⏳ Forjando llaves elípticas Ed25519 de forma local y soberana...\nPor favor, espera un momento.";

        try {
            const llaves = await MacondoCrypto.forjarIdentidad(alias, pass);

            const nuevaCedula = {
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
                    "infraestructura_nodo": datosFisicos.hardware,
                    "protocolos_activos": ["WebTorrent", "PGP"],
                    "almacenamiento_asignado_gb": datosFisicos.almacenamiento
                },
                "matriz_acceso_artefactos": {
                    "sinfonia": { "rol": "Iniciado", "puede_subir_magnet_links": false },
                    "boveda": { "nivel_acceso": "Nivel_1_Lectura", "llaves_ofuscadas": false }
                },
                "registro_meritos_termodinamicos": {
                    "aporte_principal": datosFisicos.aporte,
                    "puntos_contribucion": 0,
                    "ultimo_hash_consenso": "0x0000000000000000000000000000000000000000"
                },
                "linaje_generacional": [],
                "autorizaciones": {
                    "firma_oficial_validador": ""
                }
            };

            const jsonString = JSON.stringify(nuevaCedula, null, 2);
            previewElement.value = jsonString;

            // Actualizar la caja de estatus visual inmediatamente en la RAM
            this.cargarPerfilVisual(nuevaCedula, { statusBox });

            // Descarga automatizada local
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `cedula_${alias}_iniciado.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            previewElement.value = `❌ Ocurrió un error en la forja criptográfica:\n${err.message}`;
        }
    }
};