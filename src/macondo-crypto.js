/**
 * PROYECTO MACONDO: NÚCLEO DE SEGURIDAD DIGITAL CRIPTOGRÁFICA
 * Motor universal e integrable (Corregido para importación asíncrona)
 */

const OPENPGP_CDN = 'https://unpkg.com/openpgp@5.11.0/dist/openpgp.min.js';

async function asegurarOpenPGP() {
    // Si ya fue inyectado globalmente, lo usamos
    if (window.openpgp && typeof window.openpgp.generateKey === 'function') {
        return window.openpgp;
    }
    try {
        const modulo = await import(OPENPGP_CDN);
        
        // Corrección táctica: algunos entornos anidan el motor dentro de modulo.default o modulo directamente
        const motorReal = modulo.generateKey ? modulo : (modulo.default || window.openpgp);
        
        if (!motorReal || typeof motorReal.generateKey !== 'function') {
            throw new Error("El objeto cargado no contiene las funciones criptográficas de OpenPGP.");
        }
        
        window.openpgp = motorReal;
        return motorReal;
    } catch (error) {
        console.error("🔴 [CRÍTICO] Error al estructurar el motor OpenPGP desde el CDN:", error);
        throw error;
    }
}

export const MacondoCrypto = {
    
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
                encryptedPrivateKey: privateKey
            };
        } catch (error) {
            console.error("[!] Error en el Rito de Forja:", error);
            throw error;
        }
    },

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

    async validarInvitacion(cedulaNodal, llavePublicaPadre) {
        const datosA_Verificar = cedulaNodal.metadata.alias_custodio + cedulaNodal.metadata.fecha_forja;
        const firmaPadre = cedulaNodal.red_de_confianza.firma_custodio_maestro;
        return await this.verificarIntegridad(datosA_Verificar, firmaPadre, llavePublicaPadre);
    }
};