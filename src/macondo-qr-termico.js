/**
 * PROYECTO MACONDO - NÚCLEO DE SEGURIDAD DIGITAL
 * Módulo: Sello QR Analógico y Validación Offline para Tickets Térmicos
 * Dependencias: openpgp.js (Criptografía), qrcode.js (Rendereo Visual)
 */

const MacondoQRTermico = {
    
    /**
     * 1. FORJA DEL SELLO QR (Emisión en el Patio Comercial)
     * Toma los datos críticos del ticket, genera una firma PGP desprendida
     * y compacta todo en un único string listo para la librería de QR.
     * * @param {Object} txData - Datos de la transacción (monto, pin, hash consenso)
     * @param {string} privateKeyArmored - Clave privada PGP del Mercante emisor
     * @param {string} passphrase - Frase de acceso para desbloquear la clave privada en RAM
     * @returns {Promise<string>} String optimizado para el código QR
     */
    async forjarSelloQR(txData, privateKeyArmored, passphrase) {
        try {
            // 1. Estructurar el payload de forma ultra-compacta para ahorrar bytes en el QR
            const payloadCompacto = {
                h: txData.ultimo_hash_consenso,
                p: txData.pin_verificacion,
                m: txData.monto_puntos,
                t: txData.timestamp || Math.floor(Date.now() / 1000),
                id: txData.id_mercante
            };

            const textoA堅irmar = JSON.stringify(payloadCompacto);

            // 2. Leer y desbloquear la clave privada en la memoria RAM de forma segura
            const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
            const privateKeyDesbloqueada = await openpgp.decryptKey({
                privateKey,
                passphrase
            });

            // 3. Crear el mensaje de texto claro para firmar
            const mensajeTexto = await openpgp.createCleartextMessage({ text: textoA堅irmar });

            // 4. Generar la firma PGP desprendida (Detached Signature)
            const firmaDesprendida = await openpgp.sign({
                message: mensajeTexto,
                signingKeys: privateKeyDesbloqueada,
                detached: true // Crucial para mantener el payload y la firma separados
            });

            // 5. Empaquetar todo en una estructura optimizada.
            // Removemos los saltos de línea redundantes de la armadura PGP para reducir densidad en el QR
            const firmaMinimizada = firmaDesprendida
                .replace(/-----BEGIN PGP SIGNATURE-----/\g, "")
                .replace(/-----END PGP SIGNATURE-----/\g, "")
                .replace(/\s+/g, ""); // Remueve espacios y saltos de línea

            // Retornamos un string unificado por un delimitador seguro (|) 
            // Formato: PAYLOAD_JSON_BASE64|FIRMA_RAW_BASE64
            const payloadBase64 = btoa(unescape(encodeURIComponent(textoA堅irmar)));
            
            return `${payloadBase64}|${firmaMinimizada}`;

        } catch (error) {
            console.error("[!] Error en la forja del Sello QR PGP:", error);
            throw error;
        }
    },

    /**
     * 2. VALIDACIÓN DEL SELLO QR (Escaneo Offline en otro Nodo/Patio)
     * Desempaqueta el string del QR escaneado, reconstruye la estructura PGP
     * y valida la autenticidad usando la clave pública del Mercante registrado.
     * * @param {string} datosEscaneadosQR - El string crudo leído por la cámara
     * @param {string} publicKeyArmored - Clave pública PGP del Mercante que emitió el ticket
     * @returns {Promise<Object>} Resultado de la validación y datos descifrados
     */
    async validarSelloQR(datosEscaneadosQR, publicKeyArmored) {
        try {
            // 1. Separar el payload de la firma usando el delimitador
            const partes = datosEscaneadosQR.split("|");
            if (partes.length !== 2) {
                throw new Error("Formato de Sello QR de Macondo inválido o alterado.");
            }

            const payloadBase64 = partes[0];
            const firmaRawBase64 = partes[1];

            // 2. Reconstruir el JSON del payload original
            const textoOriginal = decodeURIComponent(escape(atob(payloadBase64)));
            const payloadData = JSON.parse(textoOriginal);

            // 3. Reconstruir la armadura oficial de la firma PGP desprendida
            // Volvemos a formatear el bloque con saltos de línea cada 64 caracteres si es necesario,
            // aunque openpgp.js procesa bloques continuos si se le devuelven sus cabeceras nativas.
            const firmaReconstruida = 
                `-----BEGIN PGP SIGNATURE-----\n\n` +
                firmaRawBase64 +
                `\n-----END PGP SIGNATURE-----`;

            // 4. Cargar la clave pública de validación desde la Cédula Nodal del emisor
            const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

            // 5. Preparar la verificación criptográfica en RAM
            const mensajeTexto = await openpgp.createCleartextMessage({ text: textoOriginal });
            const objetoFirma = await openpgp.readSignature({ armoredSignature: firmaReconstruida });

            const verificacion = await openpgp.verify({
                message: mensajeTexto,
                signature: objetoFirma,
                verificationKeys: publicKey
            });

            // 6. Analizar validez de la firma
            const firmaValida = await verificacion.signatures[0].verified;

            return {
                esValido: firmaValida,
                datos: payloadData,
                keyId: verificacion.signatures[0].keyID.toHex().toUpperCase(),
                timestampValidacion: Math.floor(Date.now() / 1000)
            };

        } catch (error) {
            console.error("[!] Error crítico durante la validación offline del QR:", error);
            return { esValido: false, error: error.message };
        }
    }
};