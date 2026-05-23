/**
 * PROYECTO MACONDO - MOTOR DE CONSENSO Y PRUEBA DE APORTE
 * Flujo de validación en cadena para ascensos del gremio Sinfonía.
 */
import { MacondoCrypto } from "./macondo-crypto.js?v=999";

export const ConsensoLogica = {
    /**
     * ESTACIÓN APRENDIZ: Forja el Certificado de Prueba de Aporte inicial.
     */
    async forjarPruebaAporte(aliasAprendiz, tipoAporte, descripcionDetallada, llavePrivada, frasePaso) {
        const manifiesto = {
            id_aporte: "contrib_" + Math.random().toString(16).substring(2, 10),
            gremio: "Sinfonía Discoteca",
            aprendiz: aliasAprendiz,
            tipo_aporte: tipoAporte, // "15 Canciones" o "2 Álbumes"
            detalles: descripcionDetallada,
            timestamp_creacion: new Date().toISOString(),
            estado_cadena: "Emitido por Aprendiz"
        };

        const textoA_Firmar = JSON.stringify(manifiesto, null, 2);
        // El aprendiz sella su aporte con su propia llave privada
        const firmaAprendiz = await MacondoCrypto.firmarAccion(textoA_Firmar, llavePrivada, frasePaso);

        return {
            ...manifiesto,
            firmas_cadena: {
                firma_aprendiz: firmaAprendiz
            }
        };
    },

    /**
     * ESTACIÓN OFICIAL: Verifica el aporte del aprendiz y estampa la firma de auditoría física.
     */
    async verificarYFirmarOficial(certificadoCargado, aliasOficial, llavePrivadaOficial, fraseOficial) {
        if (certificadoCargado.estado_cadena !== "Emitido por Aprendiz") {
            throw new Error("El certificado no se encuentra en el estado requerido para auditoría de Oficial.");
        }

        // Clonamos el certificado para mantener inmutable el flujo de datos anterior
        const certificadoVerificado = JSON.parse(JSON.stringify(certificadoCargado));
        
        // Creamos un sello de auditoría de Oficial
        const auditoriaOficial = {
            id_aporte: certificadoVerificado.id_aporte,
            oficial_auditor: aliasOficial,
            timestamp_auditoria: new Date().toISOString(),
            veredicto: "Aprobado - Curaduría Estricta Conforme"
        };

        const textoFirma = JSON.stringify(auditoriaOficial, null, 2);
        const firmaOficial = await MacondoCrypto.firmarAccion(textoFirma, llavePrivadaOficial, fraseOficial);

        certificadoVerificado.estado_cadena = "Verificado por Oficial";
        certificadoVerificado.firmas_cadena.firma_oficial = firmaOficial;
        certificadoVerificado.auditoria_oficial = auditoriaOficial;

        return certificadoVerificado;
    },

    /**
     * ESTACIÓN MAESTROS: Aplica el umbral de firmas colectivas (N de M) para consagrar el activo.
     */
    async consagrarEnSalaMaestros(certificadoCargado, aliasMaestro, llavePrivadaMaestro, fraseMaestro) {
        if (certificadoCargado.estado_cadena !== "Verificado por Oficial" && certificadoCargado.estado_cadena !== "Consagración Parcial (Multi-Firma)") {
            throw new Error("El certificado requiere auditoría previa de un Oficial antes del rito de Consagración.");
        }

        const certificadoConsagrado = JSON.parse(JSON.stringify(certificadoCargado));
        
        const estampaMaestro = {
            maestro_consagrador: aliasMaestro,
            timestamp_consagracion: new Date().toISOString()
        };

        const textoFirma = JSON.stringify(estampaMaestro, null, 2);
        const firmaMaestro = await MacondoCrypto.firmarAccion(textoFirma, llavePrivadaMaestro, fraseMaestro);

        if (!certificadoConsagrado.firmas_cadena.firmas_maestros) {
            certificadoConsagrado.firmas_cadena.firmas_maestros = [];
        }

        // Inyectamos la firma del maestro actual en el vector de firmas múltiples
        certificadoConsagrado.firmas_cadena.firmas_maestros.push({
            maestro: aliasMaestro,
            firma: firmaMaestro,
            metadata: estampaMaestro
        });

        const firmasAcumuladas = certificadoConsagrado.firmas_cadena.firmas_maestros.length;
        
        // Simulación de Umbral Múltiple (Requerimos 2 firmas de maestros para emitir el bloque discoteca.json)
        if (firmasAcumuladas >= 2) {
            certificadoConsagrado.estado_cadena = "Consagrado por Consejo de Maestros";
        } else {
            certificadoConsagrado.estado_cadena = "Consagración Parcial (Multi-Firma)";
        }

        return certificadoConsagrado;
    },

    /**
     * COMPILADOR: Toma un certificado totalmente consagrado y genera la actualización de 'discoteca.json'
     */
    compilarActivoDiscoteca(certificadoTotalmenteConsagrado) {
        return {
            gremio: "Sinfonía Discoteca",
            ultima_actualizacion: new Date().toISOString(),
            origen_consenso_id: certificadoTotalmenteConsagrado.id_aporte,
            bloque_curaduria: {
                curador_ascendido: certificadoTotalmenteConsagrado.aprendiz,
                tipo: certificadoTotalmenteConsagrado.tipo_aporte,
                manifiesto_recursos: certificadoTotalmenteConsagrado.detalles
            },
            seguridad_red: {
                consenso_tipo: "Prueba de Aporte (Multi-Firma N/M)",
                firmas_validas: certificadoTotalmenteConsagrado.firmas_cadena.firmas_maestros.map(m => m.maestro)
            }
        };
    }
};