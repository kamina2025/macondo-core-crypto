/**
 * PROYECTO MACONDO: NÚCLEO DE SEGURIDAD DIGITAL CRIPTOGRÁFICA
 * Motor universal e integrable - Versión 100% Local y Soberana
 */

// Importamos la librería directamente desde nuestra propia carpeta src


export const MacondoCrypto = {
    
    /**
     * RITO DE FORJA: Genera llaves universales en la RAM de forma local.
     */
    async forjarIdentidad(alias, frasePaso) {
        try {
            console.log(`✨ Iniciando Rito de Forja Local para el custodio: ${alias}...`);
            
            // Al importar el script local, 'openpgp' se inyecta directamente en el objeto global del navegador
            const pgp = window.openpgp;
            
            if (!pgp || typeof pgp.generateKey !== 'function') {
                throw new Error("El motor local OpenPGP no se ha inicializado correctamente en window.");
            }

            const { privateKey, publicKey } = await pgp.generateKey({
                type: 'ecc', 
                curve: 'ed25519', // Curva rápida y ligera ideal para hardware humilde
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

            const verificationResult = await pgp.verify({
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
/**
     * RITO DE ASCENSO: Deriva un certificado generacional nuevo firmando el nexo con el anterior.
     * @param {Object} cedulaActual - El JSON completo de la cédula del custodio.
     * @param {String} nuevoRango - El nombre del nuevo rango alcanzado (ej: 'Oficial_Nodal').
     * @param {String} frasePasoNueva - Contraseña para la nueva llave.
     * @param {String} frasePasoVieja - Contraseña de la llave anterior para autorizar la firma del linaje.
     */
    async derivarCertificadoPorAscenso(cedulaActual, nuevoRango, frasePasoNueva, frasePasoVieja) {
        try {
            const pgp = window.openpgp;
            const alias = cedulaActual.metadata.alias_custodio;
            const genSiguiente = cedulaActual.metadata.generacion_actual + 1;

            console.log(`⛓️ Derivando Generación ${genSiguiente} para ${alias} por ascenso a ${nuevoRango}...`);

            // 1. Forjar la nueva identidad criptográfica para el nuevo rango
            const nuevaIdentidad = await this.forjarIdentidad(`${alias} (${nuevoRango})`, frasePasoNueva);

            // 2. Preparar el manifiesto de traspaso que encadena las dos generaciones
            const manifiestoTraspaso = {
                alias: alias,
                rango_anterior: cedulaActual.metadata.rango_actual,
                nuevo_rango: nuevoRango,
                generacion_anterior: cedulaActual.metadata.generacion_actual,
                nueva_generacion: genSiguiente,
                nueva_llave_publica: nuevaIdentidad.publicKey,
                fecha_traspaso: new Date().toISOString()
            };

            const textoManifiesto = JSON.stringify(manifiestoTraspaso);

            // 3. Firmar el manifiesto usando la llave privada de la generación anterior (Prueba de Linaje)
            const firmaLinaje = await this.firmarAccion(
                textoManifiesto, 
                cedulaActual.certificado_actual.pgp_encrypted_private_key, 
                frasePasoVieja
            );

            // 4. Construir el eslabón histórico para guardarlo en el pasado
            const eslabonPasado = {
                generacion: cedulaActual.metadata.generacion_actual,
                rango: cedulaActual.metadata.rango_actual,
                fecha_forja: cedulaActual.certificado_actual.fecha_forja,
                pgp_public_key: cedulaActual.certificado_actual.pgp_public_key,
                firma_de_ascenso: firmaLinaje // Este campo demuestra que la llave vieja dio paso a la nueva
            };

            // 5. Clonar y mutar la cédula estructuralmente para el retorno seguro
            const nuevaCedula = JSON.parse(JSON.stringify(cedulaActual));
            
            nuevaCedula.metadata.rango_actual = nuevoRango;
            nuevaCedula.metadata.generacion_actual = genSiguiente;
            
            nuevaCedula.certificado_actual = {
                fecha_forja: manifiestoTraspaso.fecha_traspaso,
                pgp_public_key: nuevaIdentidad.publicKey,
                pgp_encrypted_private_key: nuevaIdentidad.encryptedPrivateKey
            };

            if (!nuevaCedula.linaje_generacional) nuevaCedula.linaje_generacional = [];
            nuevaCedula.linaje_generacional.push(eslabonPasado);

            console.log(`🟢 [ÉXITO] Certificado Generacional derivado. Linaje criptográfico asegurado.`);
            return nuevaCedula;

        } catch (error) {
            console.error("[!] Fallo en el Rito de Ascenso Generacional:", error);
            throw error;
        }
    }