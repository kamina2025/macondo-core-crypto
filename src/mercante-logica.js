/**
 * PROYECTO MACONDO - NÚCLEO DE INTERCAMBIO MERCANTE Y FIDELIZACIÓN V2
 * Gestión de PINs de 5,000 COP y matriz de descuentos (5% Digital / 2% Hidroponía).
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
    acumularPuntosIniciado(certificadoIniciado, valorTransaccion) {
        const puntosA_Sumar = Math.floor(valorTransaccion / 1000);

        // 1. Aseguramos que exista el contenedor principal de méritos
        if (!certificadoIniciado.registro_meritos_termodinamicos) {
            certificadoIniciado.registro_meritos_termodinamicos = {};
        }
        
        // 2. Aseguramos que la variable de puntos esté inicializada numéricamente
        if (certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion === undefined) {
            certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion = 0;
        }

        // 3. BLINDAJE CRÍTICO: Aseguramos que el array de historial exista antes del push
        if (!certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios) {
            certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios = [];
        }

        // 4. Operación segura en la RAM
        certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion += puntosA_Sumar;
        certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios.push({
            tipo: "Acumulación por Intercambio",
            monto: valorTransaccion,
            puntos_ganados: puntosA_Sumar,
            fecha: new Date().toISOString()
        });

        return certificadoIniciado;
    },

    /**
     * MATRIZ DE DESCUENTOS SIMULADA
     * Aplica las tasas del ecosistema según la naturaleza del artefacto o producto.
     */
    calcularDescuento(tipoProducto, valorOriginal, puntosDisponibles) {
        let tasa = 0;
        let esValido = false;

        // Configuración de tasas solicitadas
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
        
        // Simulación del costo en puntos: Cada peso de descuento equivale a 1 punto deducido
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
    redimirDescuentoCertificado(certificadoIniciado, tipoProducto, valorOriginal) {
        const puntosActuales = certificadoIniciado.registro_meritos_termodinamicos?.puntos_redencion || 0;
        const calculo = this.calcularDescuento(tipoProducto, valorOriginal, puntosActuales);

        if (calculo.error) throw new Error(calculo.error);
        if (!calculo.autorizado) {
            throw new Error(`Puntos insuficientes para el descuento del ${calculo.tasa_aplicada}. Requiere ${calculo.puntos_costo} pts, tiene ${puntosActuales} pts.`);
        }

        // Aseguramos la existencia del historial también en la redención
        if (!certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios) {
            certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios = [];
        }

        certificadoIniciado.registro_meritos_termodinamicos.puntos_redencion -= calculo.puntos_costo;
        certificadoIniciado.registro_meritos_termodinamicos.historial_intercambios.push({
            tipo: "Descuento Redimido",
            producto: tipoProducto,
            puntos_deducidos: calculo.puntos_costo,
            ahorro_cop: calculo.descuento_cop,
            fecha: new Date().toISOString()
        });

        return {
            certificadoActualizado: certificadoIniciado,
            detalles: calculo
        };
    }
};