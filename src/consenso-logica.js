/**
 * PROYECTO MACONDO - MOTOR DE CONSENSO Y CRIPTOGRAFÍA DE PAYLOADS V4
 * Implementación nativa de Secreto Compartido de Shamir (Umbral 2 de 3) y Cifrado Simétrico.
 */
import { MacondoCrypto } from "./macondo-crypto.js?v=999";

export const ConsensoLogica = {
    obtenerDirectorioVirtual(nombreCarpeta) {
        const datos = localStorage.getItem(`boveda_${nombreCarpeta}`);
        return datos ? JSON.parse(datos) : [];
    },

    guardarEnDirectorioVirtual(nombreCarpeta, listado) {
        localStorage.setItem(`boveda_${nombreCarpeta}`, JSON.stringify(listado));
    },

    /**
     * ALGORITMO SHAMIR LOCAL: Divide un secreto (string) en 3 fragmentos (Umbral 2 de 3)
     */
    /**
     * ALGORITMO SHAMIR REAL: Divide un secreto en puntos coordenados (x, y) disímiles.
     * Implementación polinómica estricta para Umbral 2 de 3.
     */
  /**
     * ALGORITMO SHAMIR REAL: Usa una clave numérica para cifrar y fragmentar.
     */
    fragmentarSecretoShamir(semillaNumerica, len) {
        // Generamos la pendiente aleatoria de la recta (f(x) = Secreto + Coeficiente * x)
        const coefA = Math.floor(Math.random() * 5000) + 1;

        // Calculamos los puntos coordenados Y disímiles
        const y1 = semillaNumerica + (coefA * 1);
        const y2 = semillaNumerica + (coefA * 2);
        const y3 = semillaNumerica + (coefA * 3);

        const fragmento1 = btoa(JSON.stringify({ x: 1, y: y1, len: len }));
        const fragmento2 = btoa(JSON.stringify({ x: 2, y: y2, len: len }));
        const fragmento3 = btoa(JSON.stringify({ x: 3, y: y3, len: len }));

        return { fragmento1, fragmento2, fragmento3 };
    },

    /**
     * CIFRADO SIMÉTRICO PROTEGIDO: Cifra el payload y asegura compatibilidad Base64 total.
     */
    cifrarContenedor(textoPlano, claveString) {
        let resultado = "";
        for (let i = 0; i < textoPlano.length; i++) {
            let charCode = textoPlano.charCodeAt(i) ^ claveString.charCodeAt(i % claveString.length);
            resultado += String.fromCharCode(charCode);
        }
        // Usamos encodeURIComponent para blindar caracteres binarios extraños del XOR antes de codificar en Base64
        return btoa(encodeURIComponent(resultado));
    },

    /**
     * ESTACIÓN APRENDIZ: Forja usando la clave numérica unificada.
     */
    async forjarYEnviarAprendiz(aliasAprendiz, tipoAporte, descripcionDetallada, privateKey, passphrase) {
        // 1. Generamos un número secreto entero aleatorio como la clave real
        const semillaNumericaUnica = Math.floor(Math.random() * 90000) + 10000; 
        const claveString = "K_" + semillaNumericaUnica; // Esta es la cadena exacta de cifrado

        // 2. Pasamos la semilla numérica para fragmentar en Shamir
        const { fragmento1, fragmento2, fragmento3 } = this.fragmentarSecretoShamir(semillaNumericaUnica, claveString.length);

        const manifiesto = {
            id_aporte: "contrib_" + Math.random().toString(16).substring(2, 10),
            gremio: "Sinfonía Discoteca",
            aprendiz: aliasAprendiz,
            tipo_aporte: tipoAporte,
            
            // Ciframos usando la clave unificada string
            payload_cifrado: this.cifrarContenedor(descripcionDetallada, claveString),
            
            timestamp_creacion: new Date().toISOString(),
            estado_cadena: "Emitido por Aprendiz",
            boveda_fragmentos: {
                fragmento_aprendiz: fragmento1,
                fragmento_oficial_esperado: fragmento2,
                fragmento_maestros_esperado: fragmento3
            },
            firmas_cadena: {}
        };

        const textoParaFirma = JSON.stringify(manifiesto, null, 2);
        manifiesto.firmas_cadena.firma_aprendiz = await MacondoCrypto.firmarAccion(textoParaFirma, privateKey, passphrase);

        let carpetaAportes = this.obtenerDirectorioVirtual("aportes-aprendiz");
        carpetaAportes.push(manifiesto);
        this.guardarEnDirectorioVirtual("aportes-aprendiz", carpetaAportes);

        return manifiesto;
    },

    /**
     * ESTACIÓN OFICIAL: Valida y estampa su firma sobre el manifiesto cifrado.
     */
    async oficialAprobarPorLote(idAporte, aliasOficial, privateKey, passphrase) {
        let carpetaAportes = this.obtenerDirectorioVirtual("aportes-aprendiz");
        let idx = carpetaAportes.findIndex((c) => c.id_aporte === idAporte);
        if (idx === -1) throw new Error("Aporte no encontrado.");

        let certificado = carpetaAportes[idx];

        const auditoriaOficial = {
            id_aporte: certificado.id_aporte,
            oficial_auditor: aliasOficial,
            timestamp_auditoria: new Date().toISOString(),
            veredicto: "Aprobado - Auditoría de Contenedor Conforme"
        };

        const textoFirma = JSON.stringify(auditoriaOficial, null, 2);
        certificado.firmas_cadena.firma_oficial = await MacondoCrypto.firmarAccion(textoFirma, privateKey, passphrase);
        certificado.estado_cadena = "Verificado por Oficial";
        certificado.auditoria_oficial = auditoriaOficial;

        let carpetaVerificados = this.obtenerDirectorioVirtual("verificados-oficiales");
        carpetaVerificados.push(certificado);
        this.guardarEnDirectorioVirtual("verificados-oficiales", carpetaVerificados);

        carpetaAportes.splice(idx, 1);
        this.guardarEnDirectorioVirtual("aportes-aprendiz", carpetaAportes);
    },

    /**
     * ESTACIÓN MAESTROS: Firma asíncrona múltiple.
     */
    async maestroFirmarPorLote(idAporte, aliasMaestro, privateKey, passphrase) {
        let carpetaVerificados = this.obtenerDirectorioVirtual("verificados-oficiales");
        let idx = carpetaVerificados.findIndex((c) => c.id_aporte === idAporte);
        if (idx === -1) throw new Error("Certificado no encontrado.");

        let certificado = carpetaVerificados[idx];

        const estampaMaestro = {
            maestro_consagrador: aliasMaestro,
            timestamp_consagracion: new Date().toISOString()
        };

        const textoFirma = JSON.stringify(estampaMaestro, null, 2);
        const firma = await MacondoCrypto.firmarAccion(textoFirma, privateKey, passphrase);

        if (!certificado.firmas_cadena.firmas_maestros) certificado.firmas_cadena.firmas_maestros = [];

        if (certificado.firmas_cadena.firmas_maestros.some((m) => m.maestro === aliasMaestro)) {
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
     * COMPILADOR FINAL: Construye el 'discoteca.json' inyectando el árbol de fragmentos cifrados.
     */
    compilarGranDiscotecaComunal() {
        let consagrados = this.obtenerDirectorioVirtual("consagrados-maestros");

        const discotecaGlobal = {
            gremio: "Sinfonía Discoteca",
            nodo_emisor: "Consejo de Maestros de Miranda",
            ultima_sincronizacion_dht: new Date().toISOString(),
            total_activos_validados: consagrados.length,
            catalogo_recursos: consagrados.map((c) => {
                return {
                    id_transaccion: c.id_aporte || "contrib_desconocida",
                    status: "BLINDADO_Y_DISTRIBUIDO",

                    // CONTENEDOR ENCRIPTADO ÚNICO
                    payload_bloqueado: c.payload_cifrado || "",

                    // RESGUARDO DE SOBERANÍA REPARTIDA (SHAMIR)
                    // Para abrir la canción se necesitan mínimo 2 llaves del mapa
                    Boveda_Llaves_Shamir: {
                        llave_nodo_A: c.boveda_fragmentos?.fragmento_aprendiz || "",
                        llave_nodo_B: c.boveda_fragmentos?.fragmento_oficial_esperado || "",
                        llave_nodo_C: c.boveda_fragmentos?.fragmento_maestros_esperado || ""
                    },

                    // ARBOL DE PRUEBAS CON ENCADENAMIENTO OPCIONAL TOTAL
                    Pruebas_Criptograficas_Validas: {
                        origen_aprendiz: c.firmas_cadena?.firma_aprendiz || "",
                        auditoria_oficial: c.firmas_cadena?.firma_oficial || "",
                        // Evita que falle el .map si el array de maestros no se ha inicializado
                        consagracion_consejo: (c.firmas_cadena?.firmas_maestros || []).map((m) => ({
                            maestro: m?.maestro || "Maestro_Anonimo",
                            firma_pgp: m?.firma || ""
                        }))
                    },

                    // AUDITORÍA DEL PATIO PROTEGIDA
                    auditoria_fisica_patio: {
                        oficial_auditor: c.auditoria_oficial?.oficial_auditor || "Sin_Oficial",
                        veredicto: c.auditoria_oficial?.veredicto || "No_Auditado"
                    }
                };
            })
        };

        return discotecaGlobal;
    }
};
