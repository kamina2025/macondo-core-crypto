/**
 * PROYECTO MACONDO - NÚCLEO DE INTERCAMBIO MERCANTE Y FIDELIZACIÓN V2 (CORREGIDO)
 * Gestión de PINs de 5,000 COP, matriz de descuentos (5% Digital / 2% Hidroponía) y quema de tokens.
 */

export const MercanteLogica = {
    
    obtenerBovedaMercante(nombre) {
        const datos = localStorage.getItem(`mercante_${nombre}`);
        return datos ? JSON.parse(datos) : {};
    },

    guardarBovedaMercante(nombre, datos) {
        localStorage.setItem(`mercante_${nombre}`, JSON.stringify(datos));
    },

    /**
     * GENERADOR DE PIN (Costo estándar: 5,000 COP)
     */
    generarPinArtefacto(artefacto, aliasComerciante) {
        const prefijos = { videoteca: "VID", sinfonia: "SIN", tinta: "TIN", boveda: "BOV" };
        const prefijo = prefijos[artefacto.toLowerCase()] || "GEN";
        
        const numeroPin = Math.floor(100000 + Math.random() * 900000);
        const pinCompleto = `${prefijo}-${numeroPin}`;

        let pinsActivos = this.obtenerBovedaMercante("pins_validos");
        if (!pinsActivos.lista) pinsActivos.lista = [];

        pinsActivos.lista.push({
            pin: pinCompleto,
            artefacto: artefacto,
            emitido_por: aliasComerciante,
            timestamp_emision: new Date().toISOString(),
            usado: false
        });

        this.guardarBovedaMercante("pins_validos", pinsActivos);
        return pinCompleto;
    },

    /**
     * SISTEMA DE ACUMULACIÓN: Genera lealtad inyectando puntos en la cédula.
     * Regla base: 1 punto por cada 1,000 COP transaccionados.
     */
   /**
     * FUNCIÓN AUXILIAR (NUEVA): Sella digitalmente el estado de méritos
     * para evitar que el Iniciado altere sus puntos modificando el JSON a mano.
     */
    generarSelloSeguridad(certificado) {
        const alias = certificado.metadata?.alias_custodio || "anonimo";
        const puntos = certificado.registro_meritos_termodinamicos?.puntos_redencion || 0;
        const subCadenaClave = certificado.certificado_actual?.pgp_public_key?.substring(30, 60) || "MACONDO_KEY";
        
        // Creamos una cadena de verificación combinada única
        const payloadSello = `${alias}|${puntos}|${subCadenaClave}`;
        
        // Generamos un hash Base64 simple simulando la firma criptográfica del Mercante
        return btoa(payloadSello).substring(0, 32);
    },

    /**
     * SISTEMA DE ACUMULACIÓN CON VERIFICACIÓN DE FIRMA
     */
    acumularPuntosIniciado(certificadoIniciado, valorTransaccion) {
        // Inicialización estructural segura
        certificadoIniciado.registro_meritos_termodinamicos = certificadoIniciado.registro_meritos_termodinamicos || {};
        if (certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion === undefined) {
            certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion = 0;
        }
        certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios = 
            certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios || [];

        // VERIFICACIÓN ANTES DE MUTAR: Si ya tiene un hash de consenso comercial previo, lo validamos
        if (certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso && 
            certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso !== "0x0000000000000000000000000000000000000000") {
            
            const selloCalculado = this.generarSelloSeguridad(certificadoIniciado);
            if (certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso !== selloCalculado) {
                throw new Error("ALERTA DE SEGURIDAD: El balance de puntos en este Certificado ha sido alterado manualmente o la firma del último Mercante es inválida.");
            }
        }

        // Operación en RAM
        const puntosA_Sumar = Math.floor(valorTransaccion / 1000);
        certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion += puntosA_Sumar;
        
        certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios.push({
            tipo: "Acumulación por Intercambio",
            monto: valorTransaccion,
            puntos_ganados: puntosA_Sumar,
            fecha: new Date().toISOString()
        });

        // RE-SELLADO: Inyectamos el sello inmutable simulando la firma OpenPGP del nodo comercial
        certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso = this.generarSelloSeguridad(certificadoIniciado);

        return certificadoIniciado;
    },

    /**
     * MATRIZ DE DESCUENTOS SIMULADA
     * Aplica las tasas del ecosistema según la naturaleza del artefacto o producto.
     */
    calcularDescuento(tipoProducto, valorOriginal, puntosDisponibles) {
        let tasa = 0;
        let esValido = false;

        if (tipoProducto.toLowerCase() === "hidroponico") {
            tasa = 0.02; // 2% para lechugas, sandías mini, etc.
            esValido = true;
        } else if (["boveda", "videoteca", "sinfonia", "tinta", "digital"].includes(tipoProducto.toLowerCase())) {
            tasa = 0.05; // 5% para la infraestructura digital
            esValido = true;
        }

        if (!esValido) return { error: "Tipo de producto no parametrizado en la red." };

        const descuentoCalculado = valorOriginal * tasa;
        const valorFinal = valorOriginal - descuentoCalculado;
        
        const puntosRequeridos = Math.ceil(descuentoCalculado);
        const puedeAplicar = puntosDisponibles >= puntosRequeridos;

        return {
            tasa_aplicada: `${tasa * 100}%`,
            descuento_cop: descuentoCalculado,
            precio_final_cop: valorFinal,
            puntos_costo: puntosRequeridos,
            autorizado: puedeAplicar
        };
    },

    /**
     * REDENCIÓN EFECTIVA: Aplica el descuento restando los puntos del certificado.
     */
   /**
     * REDENCIÓN EFECTIVA CON VERIFICACIÓN DE FIRMA
     */
    redimirDescuentoCertificado(certificadoIniciado, tipoProducto, valorOriginal) {
        certificadoIniciado.registro_meritos_termodinamicos = certificadoIniciado.registro_meritos_termodinamicos || {};
        
        // VERIFICACIÓN DE INTEGRIDAD ANTES DE APLICAR EL DESCUENTO
        const selloCalculado = this.generarSelloSeguridad(certificadoIniciado);
        if (certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso && 
            certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso !== selloCalculado &&
            certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso !== "0x0000000000000000000000000000000000000000") {
            throw new Error("ALERTA DE SEGURIDAD: Intento de fraude detectado. El linaje de puntos no coincide con la última firma del patio.");
        }

        const puntosActuales = certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion || 0;
        const calculo = this.calcularDescuento(tipoProducto, valorOriginal, puntosActuales);

        if (calculo.error) throw new Error(calculo.error);
        if (!calculo.autorizado) {
            throw new Error(`Puntos insuficientes para el descuento del ${calculo.tasa_aplicada}. Requiere ${calculo.puntos_costo} pts, tiene ${puntosActuales} pts.`);
        }

        if (!certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios) {
            certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios = [];
        }

        // Deducimos puntos de forma legítima
        certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion -= calculo.puntos_costo;
        
        certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios.push({
            tipo: "Descuento Redimido",
            producto: tipoProducto,
            puntos_deducidos: calculo.puntos_costo,
            ahorro_cop: calculo.descuento_cop,
            fecha: new Date().toISOString()
        });

        // RE-SELLADO: Actualizamos la firma con el nuevo balance neto
        certificadoIniciado.registro_meritos_termodinamicos.ultimo_hash_consenso = this.generarSelloSeguridad(certificadoIniciado);

        return {
            certificadoActualizado: certificadoIniciado,
            detalles: calculo
        };
    },

    /**
     * VALIDACIÓN Y QUEMA DE PIN: Evita el doble gasto en los artefactos del patio.
     */
    validarYConsumirPin(pinIngresado, artefactoDestino) {
        let pinsActivos = this.obtenerBovedaMercante("pins_validos");
        if (!pinsActivos.lista) pinsActivos.lista = [];

        const tokenEncontrado = pinsActivos.lista.find(p => p.pin === pinIngresado.trim());

        if (!tokenEncontrado) {
            throw new Error("El PIN ingresado no existe o no ha sido emitido por un Mercante autorizado.");
        }

        if (tokenEncontrado.usado) {
            throw new Error(`El PIN ya fue consumido el: ${new Date(tokenEncontrado.timestamp_consumo).toLocaleString()}`);
        }

        if (tokenEncontrado.artefacto.toLowerCase() !== artefactoDestino.toLowerCase()) {
            throw new Error(`PIN incorrecto. Este token fue forjado exclusivamente para el artefacto: ${tokenEncontrado.artefacto}`);
        }

        tokenEncontrado.usado = true;
        tokenEncontrado.timestamp_consumo = new Date().toISOString();

        this.guardarBovedaMercante("pins_validos", pinsActivos);

        return {
            valido: true,
            emitido_por: tokenEncontrado.emitido_por,
            fecha_emision: tokenEncontrado.timestamp_emision
        };
    }
};
function enviarPorWhatsApp(telefonoCustodio, textoTicket) {
    // encodeURIComponent codifica los saltos de línea y espacios de forma nativa
    const mensajeCodificado = encodeURIComponent(textoTicket);
    const url = `https://api.whatsapp.com/send?phone=${telefonoCustodio}&text=${mensajeCodificado}`;
    
    // Abre una ventana o redirige al chat con el ticket pre-cargado listo para enviar
    window.open(url, '_blank');
}
function imprimirTicketFisico(textoTicket) {
    const ventanaImpresion = window.open('', '_blank', 'width=300,height=400');
    ventanaImpresion.document.write(`
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; }
                pre { margin: 0; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <pre>${textoTicket}</pre>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `);
    ventanaImpresion.document.close();
}