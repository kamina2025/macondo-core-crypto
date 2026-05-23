/**
 * PROYECTO MACONDO - MOTOR DE CONSENSO Y PRUEBA DE APORTE V3
 * Flujo automatizado por RAM/Almacenamiento Local de Bóveda y Compilación unificada.
 */
import { MacondoCrypto } from "./macondo-crypto.js?v=999";

export const ConsensoLogica = {
    // Inicializar los directorios virtuales en la Bóveda de la RAM
    obtenerDirectorioVirtual(nombreCarpeta) {
        const datos = localStorage.getItem(`boveda_${nombreCarpeta}`);
        return datos ? JSON.parse(datos) : [];
    },

    guardarEnDirectorioVirtual(nombreCarpeta, listado) {
        localStorage.setItem(`boveda_${nombreCarpeta}`, JSON.stringify(listado));
    },

    /**
     * ESTACIÓN APRENDIZ: Forja y envía directo a la Bóveda del patio.
     */
    async forjarYEnviarAprendiz(aliasAprendiz, tipoAporte, descripcionDetallada, privateKey, passphrase) {
        const manifiesto = {
            id_aporte: "contrib_" + Math.random().toString(16).substring(2, 10),
            gremio: "Sinfonía Discoteca",
            aprendiz: aliasAprendiz,
            tipo_aporte: tipoAporte,
            detalles: descripcionDetallada,
            timestamp_creacion: new Date().toISOString(),
            estado_cadena: "Emitido por Aprendiz",
            firmas_cadena: {}
        };

        const texto = JSON.stringify(manifiesto, null, 2);
        manifiesto.firmas_cadena.firma_aprendiz = await MacondoCrypto.firmarAccion(texto, privateKey, passphrase);

        // Envío directo automatizado por WebTorrent (Simulado en Bóveda)
        let carpetaAportes = this.obtenerDirectorioVirtual("aportes-aprendiz");
        carpetaAportes.push(manifiesto);
        this.guardarEnDirectorioVirtual("aportes-aprendiz", carpetaAportes);

        return manifiesto;
    },

    /**
     * ESTACIÓN OFICIAL: Firma directo desde la lista virtual de la Bóveda.
     */
    async oficialAprobarPorLote(idAporte, aliasOficial, privateKey, passphrase) {
        let carpetaAportes = this.obtenerDirectorioVirtual("aportes-aprendiz");
        let idx = carpetaAportes.findIndex(c => c.id_aporte === idAporte);
        if (idx === -1) throw new Error("Aporte no encontrado en la Bóveda.");

        let certificado = carpetaAportes[idx];
        
        const auditoriaOficial = {
            id_aporte: certificado.id_aporte,
            oficial_auditor: aliasOficial,
            timestamp_auditoria: new Date().toISOString(),
            veredicto: "Aprobado - Curaduría Estricta Conforme"
        };

        const textoFirma = JSON.stringify(auditoriaOficial, null, 2);
        certificado.firmas_cadena.firma_oficial = await MacondoCrypto.firmarAccion(textoFirma, privateKey, passphrase);
        certificado.estado_cadena = "Verificado por Oficial";
        certificado.auditoria_oficial = auditoriaOficial;

        // Mover carpetas de forma transparente en la red
        let carpetaVerificados = this.obtenerDirectorioVirtual("verificados-oficiales");
        carpetaVerificados.push(certificado);
        this.guardarEnDirectorioVirtual("verificados-oficiales", carpetaVerificados);

        // Eliminar del buzón de entrada del oficial
        carpetaAportes.splice(idx, 1);
        this.guardarEnDirectorioVirtual("aportes-aprendiz", carpetaAportes);
    },

    /**
     * ESTACIÓN MAESTROS: Multi-firma asíncrona en el almacenamiento virtual.
     */
    async maestroFirmarPorLote(idAporte, aliasMaestro, privateKey, passphrase) {
        let carpetaVerificados = this.obtenerDirectorioVirtual("verificados-oficiales");
        let idx = carpetaVerificados.findIndex(c => c.id_aporte === idAporte);
        if (idx === -1) throw new Error("Certificado no encontrado en verificados.");

        let certificado = carpetaVerificados[idx];

        const estampaMaestro = {
            maestro_consagrador: aliasMaestro,
            timestamp_consagracion: new Date().toISOString()
        };

        const textoFirma = JSON.stringify(estampaMaestro, null, 2);
        const firma = await MacondoCrypto.firmarAccion(textoFirma, privateKey, passphrase);

        if (!certificado.firmas_cadena.firmas_maestros) certificado.firmas_cadena.firmas_maestros = [];
        
        // Evitar que el mismo maestro firme dos veces el mismo bloque
        if (certificado.firmas_cadena.firmas_maestros.some(m => m.maestro === aliasMaestro)) {
            throw new Error("Tus credenciales ya firmaron este aporte.");
        }

        certificado.firmas_cadena.firmas_maestros.push({ maestro: aliasMaestro, firma, metadata: estampaMaestro });

        if (certificado.firmas_cadena.firmas_maestros.length >= 2) {
            certificado.estado_cadena = "Consagrado por Consejo de Maestros";
            let carpetaConsagrados = this.obtenerDirectorioVirtual("consagrados-maestros");
            carpetaConsagrados.push(certificado);
            this.guardarEnDirectorioVirtual("consagrados-maestros", carpetaConsagrados);
            carpetaVerificados.splice(idx, 1);
        } else {
            certificado.estado_cadena = "Consagración Parcial (Multi-Firma)";
        }

        this.guardarEnDirectorioVirtual("verificados-oficiales", carpetaVerificados);
        return certificado;
    },

    /**
     * COMPILADOR SALA DE MAESTROS: Une todos los consagrados en un solo 'discoteca.json' masivo.
     */
    compilarGranDiscotecaComunal() {
        let consagrados = this.obtenerDirectorioVirtual("consagrados-maestros");
        
        const discotecaGlobal = {
            gremio: "Sinfonía Discoteca",
            nodo_emisor: "Consejo de Maestros de Miranda",
            ultima_sincronizacion_dht: new Date().toISOString(),
            total_activos_validados: consagrados.length,
            catalogo_recursos: consagrados.map(c => ({
                id_transaccion: c.id_aporte,
                curador: c.aprendiz,
                tipo: c.tipo_aporte,
                magnet_link: c.detalles,
                fecha_registro: c.auditoria_oficial.timestamp_auditoria,
                validadores: {
                    oficial: c.auditoria_oficial.oficial_auditor,
                    consejo_maestros: c.firmas_cadena.firmas_maestros.map(m => m.maestro)
                }
            }))
        };

        return discotecaGlobal;
    }
};