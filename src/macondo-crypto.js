/**
 * PROYECTO MACONDO: NÚCLEO DE SEGURIDAD DIGITAL CRIPTOGRÁFICA
 * Motor universal e integrable - Versión 100% Local y Soberana
 */

export const MacondoCrypto = {
    
    /**
     * RITO DE FORJA: Genera llaves universales en la RAM de forma local.
     */
    async forjarIdentidad(alias, frasePaso) {
        try {
            console.log(`✨ Iniciando Rito de Forja Local para el custodio: ${alias}...`);
            
            const pgp = window.openpgp;
            if (!pgp || typeof pgp.generateKey !== 'function') {
                throw new Error("El motor local OpenPGP no se ha inicializado correctamente en window.");
            }

            const { privateKey, publicKey } = await pgp.generateKey({
                type: 'ecc', 
                curve: 'ed25519', // Curva elíptica ultra-ligera
                userIDs: [{ name: alias }],
                passphrase: frasePaso
            });

            return {
                publicKey,
                encryptedPrivateKey: privateKey
            };
        } catch (error) {
            console.error("[!] Error en el Rito de Forja Local:", error);
            throw error;
        }
    },

    /**
     * FIRMA DE ACCIÓN: Firma digitalmente una cadena de texto localmente.
     */
    async firmarAccion(datosTexto, llavePrivadaArmadura, frasePaso) {
        try {
            const pgp = window.openpgp;
            const privateKey = await pgp.decryptKey({
                privateKey: await pgp.readKey({ armoredKey: llavePrivadaArmadura }),
                passphrase: frasePaso
            });

            const message = await pgp.createMessage({ text: datosTexto });
            const signature = await pgp.sign({
                message,
                signingKeys: privateKey,
                detached: true
            });

            return signature;
        } catch (error) {
            console.error("[!] Error al firmar los datos locales:", error);
            throw error;
        }
    },

    /**
     * VALIDACIÓN SOBERANA: Verifica firmas digitales sin salir del cliente.
     */
    async verificarIntegridad(datosTexto, firmaArmadura, llavePublicaTexto) {
        try {
            const pgp = window.openpgp;
            const publicKey = await pgp.readKey({ armoredKey: llavePublicaTexto });
            const signature = await pgp.readSignature({ armoredSignature: firmaArmadura });
            const message = await pgp.createMessage({ text: datosTexto });

            const verificationResult = await openpgp.verify({
                message,
                signature,
                verificationKeys: publicKey
            });

            const { signatures } = verificationResult;
            const estaVerificado = await signatures[0].verified;

            if (estaVerificado) {
                console.log("🟢 [VERIFICADO] Firma legítima confirmada localmente.");
                return true;
            } else {
                console.warn("🔴 [ALERTA] La firma NO coincide.");
                return false;
            }
        } catch (error) {
            console.error("[!] Error en verificación local:", error);
            return false;
        }
    }
};