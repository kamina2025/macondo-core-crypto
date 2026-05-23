/**
 * PROYECTO MACONDO - LOGICA DE GREMIOS Y APORTES COMUNITARIOS
 * Gestión de la pasarela de integración y pizarra táctica de tareas.
 */

export const GremioLogica = {
    // Base de datos de simulación local (Datos reales sin APIs de la calzada)
    tareasComunidad: [
        { id: 1, gremio: "Biomasa y Compostaje", tarea: "Recolección de residuos orgánicos en el bloque norte", puntos: 40, estado: "Pendiente" },
        { id: 2, gremio: "Precious Plastic", tarea: "Trituración de 10kg de polietileno de alta densidad (HDPE)", puntos: 50, estado: "En Progreso" },
        { id: 3, gremio: "Soporte de Red Mesh", tarea: "Alineación de antena nodal en el Nodo de la Abuela", puntos: 60, estado: "Pendiente" },
        { id: 4, gremio: "Sistemas Solares", tarea: "Limpieza y mantenimiento de paneles fotovoltaicos Celsia", puntos: 35, estado: "Pendiente" }
    ],

    /**
     * Renderiza la pasarela de aportes si el archivo leído corresponde a un Iniciado.
     */
    mostrarPasarelaIniciado(contenedor) {
        contenedor.style.display = "block";
        contenedor.innerHTML = `
            <div style="border: 1px solid #ff3333; padding: 15px; background: #1a0505; margin-top: 15px;">
                <h3 style="color: #ff3333; margin-top:0;">[ PASARELA DE INTEGRACIÓN DE VALOR ]</h3>
                <p style="font-size:0.85rem; color:#aaa;">Como Iniciado, selecciona tu vía de aporte para registrar méritos y validar tu nexo con la comunidad:</p>
                
                <label style="color:#ff3333;">Método de Contribución:</label>
                <select id="metodoPago" style="border-color:#ff3333; margin-bottom:10px; width:100%;">
                    <option value="nequi">📱 Transferencia Digital (Nequi / Canales Móviles)</option>
                    <option value="efectivo">💵 Efectivo Local (Depósito en Caja de Custodia)</option>
                    <option value="recurso">🛠️ Aporte de Recursos (Ejecutar Tarea de Gremio)</option>
                </select>

                <div id="detalleMetodo" style="background:#111; padding:10px; border:1px dashed #444; font-size:0.9rem;">
                    Inyectando datos de pasarela descentralizada...
                </div>
                <button id="btnRegistrarAporte" style="border-color:#ff3333; color:#ff3333; margin-top:10px;">REGISTRAR APORTE EN RAM</button>
            </div>
        `;

        // Lógica de interacción interna de la pasarela
        const select = document.getElementById("metodoPago");
        const detalle = document.getElementById("detalleMetodo");
        
        const actualizarDetalle = () => {
            if (select.value === "nequi") {
                detalle.innerHTML = "<strong>Acción:</strong> Enviar aporte al fondo comunal digital. Simulación de pasarela local activa (Sin rastreo corporativo).";
            } else if (select.value === "efectivo") {
                detalle.innerHTML = "<strong>Acción:</strong> Entrega física de papel moneda al Oficial de Guardia en el patio. Se estampará un recibo firmado criptográficamente.";
            } else {
                detalle.innerHTML = "<strong>Acción:</strong> Reclamar una tarea del menú de gremios. Tus méritos se calcularán al validar el trabajo físico realizado.";
            }
        };

        select.addEventListener("change", actualizarDetalle);
        actualizarDetalle();

        document.getElementById("btnRegistrarAporte").addEventListener("click", () => {
            alert(`🟢 Aporte vía [${select.value.toUpperCase()}] registrado con éxito en la RAM local. Datos listos para indexar.`);
        });
    },

    /**
     * Renderiza la pizarra táctica de operaciones si el archivo leído es un Custodio/Aprendiz.
     */
    mostrarPizarraCustodio(contenedor, gremioFiltro) {
        contenedor.style.display = "block";
        
        let listaHtml = "";
        this.tareasComunidad.forEach(t => {
            const esMismoGremio = t.gremio.toLowerCase().includes(gremioFiltro.toLowerCase().substring(0, 5));
            const estiloFila = esMismoGremio ? "color: #00ffcc; font-weight: bold;" : "color: #39ff14; opacity: 0.6;";
            
            listaHtml += `
                <tr style="${estiloFila} border-bottom: 1px solid #222;">
                    <td style="padding: 5px;">[${t.gremio}]</td>
                    <td style="padding: 5px;">${t.tarea}</td>
                    <td style="padding: 5px; text-align:center;">+${t.puntos} PM</td>
                    <td style="padding: 5px; text-align:right;">${t.estado}</td>
                </tr>
            `;
        });

        contenedor.innerHTML = `
            <div style="border: 1px solid #00ffcc; padding: 15px; background: #020a06; margin-top: 15px;">
                <h3 style="color: #00ffcc; margin-top:0;">[ PIZARRA TÁCTICA DE OPERACIONES ]</h3>
                <p style="font-size:0.85rem; color:#888;">Tareas asignadas y requerimientos globales de la comunidad (En verde las de tu gremio principal):</p>
                
                <table style="width:100%; font-size:0.85rem; border-collapse: collapse; font-family: monospace;">
                    <thead>
                        <tr style="color:#00ffcc; border-bottom: 1px solid #00ffcc;">
                            <th style="text-align:left; padding:5px;">Gremio</th>
                            <th style="text-align:left; padding:5px;">Requerimiento / Tarea</th>
                            <th style="text-align:center; padding:5px;">Mérito</th>
                            <th style="text-align:right; padding:5px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listaHtml}
                    </tbody>
                </table>
            </div>
        `;
    }
};