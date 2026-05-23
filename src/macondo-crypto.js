/**
 * PROYECTO MACONDO: NÚCLEO DE SEGURIDAD DIGITAL CRIPTOGRÁFICA
 * Motor universal e integrable para todos los artefactos de la comunidad.
 * Ejecución local y soberana en la RAM del Custodio.
 */

// URL del CDN oficial de OpenPGP para importación dinámica en navegadores o entornos ES Modules
const OPENPGP_CDN = 'https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js';

/**
 * Auxiliar para asegurar la disponibilidad de la librería OpenPGP en el entorno.
 */
async function asegurarOpenPGP() {
    if (window.openpgp) return window.openpgp;
    try {
        const modulo = await import(OPENPGP_CDN);
        window.openpgp = modulo;
        return modulo;
    } catch (error) {
        console.error("🔴 [CRÍTICO] No se pudo cargar el motor matemático OpenPGP desde el CDN.");
        throw error;
    }
}

export const MacondoCrypto = {
    
    /**
     * RITO DE FORJA: Genera un par de llaves universales (Pública y Privada).
     * Utiliza curvas elípticas (Ed25519) por su alta seguridad y ligereza en hardware humilde.
     */
    async forjarIdentidad(alias, frasePaso) {
        const openpgp = await asegurarOpenPGP();
        try {
            console.log(`✨ Iniciando Rito de Forja para el custodio: ${alias}...`);
            const { privateKey, publicKey } = await openpgp.generateKey({
                type: 'ecc', 
                curve: 'ed25519',
                userIDs: [{ name: alias }],
                passphrase: frasePaso
            });

            return {
                publicKey,
                encryptedPrivateKey: privateKey // Protegida localmente con la frase de paso
            };
        } catch (error) {
            console.error("[!] Error en el Rito de Forja:", error);
            throw error;
        }
    },

    /**
     * FIRMA DE ACCIÓN: Firma digitalmente una cadena de texto (como la actualización de méritos o un Magnet Link).
     * Genera una firma desprendida (detached) que sirve como prueba matemática irrefutable.
     */
    async firmarAccion(datosTexto, llavePrivadaArmadura, frasePaso) {
        const openpgp = await asegurarOpenPGP();
        try {
            const privateKey = await openpgp.decryptKey({
                privateKey: await openpgp.readKey({ armoredKey: llavePrivadaArmadura }),
                passphrase: frasePaso
            });

            const message = await openpgp.createMessage({ text: datosTexto });
            const signature = await openpgp.sign({
                message,
                signingKeys: privateKey,
                detached: true
            });

            return signature;
        } catch (error) {
            console.error("[!] Error al firmar los datos de acción:", error);
            throw error;
        }
    },

    /**
     * VALIDACIÓN SOBERANA: Verifica de forma matemática que una firma corresponda al mensaje y a la llave pública.
     * Garantiza la integridad de los activos y previene la manipulación de datos en el cliente.
     */
    async verificarIntegridad(datosTexto, firmaArmadura, llavePublicaTexto) {
        const openpgp = await asegurarOpenPGP();
        try {
            const publicKey = await openpgp.readKey({ armoredKey: llavePublicaTexto });
            const signature = await openpgp.readSignature({ armoredSignature: firmaArmadura });
            const message = await openpgp.createMessage({ text: datosTexto });

            const verificationResult = await openpgp.verify({
                message,
                signature,
                verificationKeys: publicKey
            });

            const { signatures } = verificationResult;
            const estaVerificado = await signatures[0].verified;

            if (estaVerificado) {
                console.log("🟢 [VERIFICADO] Firma legítima. Integridad confirmada matemáticamente.");
                return true;
            } else {
                console.warn("🔴 [ALERTA] La firma NO coincide. Datos adulterados detectados.");
                return false;
            }
        } catch (error) {
            console.error("[!] Error durante la verificación criptográfica:", error);
            return false;
        }
    },

    /**
     * FILTRADO ANTISYBIL (Acceso por Invitación): 
     * Valida si los metadatos esenciales de una cédula fueron firmados por un Custodio Maestro o un nodo autorizado.
     */
    async validarInvitacion(cedulaNodal, llavePublicaPadre) {
        // Concatenamos metadatos críticos para comprobar que la invitación es auténtica
        const datosA_Verificar = cedulaNodal.metadata.alias_custodio + cedulaNodal.metadata.fecha_forja;
        const firmaPadre = cedulaNodal.red_de_confianza.firma_custodio_maestro;
        
        return await this.verificarIntegridad(datosA_Verificar, firmaPadre, llavePublicaPadre);
    }
};