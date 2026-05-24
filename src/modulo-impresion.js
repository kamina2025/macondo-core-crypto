/**
 * -------------------------------------------------------------------
 * MÓDULO DE EMISIÓN ANALÓGICA: TICKET DE REDENCIÓN Y FORJA
 * -------------------------------------------------------------------
 */

function generarTicketMercante(datosPasaporte, pinValidacion) {
    const anchoTicket = 32; // Estándar aproximado para impresoras de 58mm en caracteres
    const lineaDivisoria = "=".repeat(anchoTicket);
    const lineaSuave = "-".repeat(anchoTicket);

    const fechaActual = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    let ticket = "";
    ticket += `${lineaDivisoria}\n`;
    ticket += "      PROYECTO  MACONDO       \n";
    ticket += "    - SOBERANÍA  DIGITAL -    \n";
    ticket += `${lineaDivisoria}\n`;
    ticket += `Fecha: ${fechaActual.split(',')[0]}\n`;
    ticket += `Hora:  ${fechaActual.split(',')[1].trim()}\n`;
    ticket += `Estación: Mesa Mercante (Patio)\n`;
    ticket += `${lineaSuave}\n`;
    ticket += `CUSTODIO: ${datosPasaporte.nombre || 'Anonimo'}\n`;
    ticket += `RANGO:    ${datosPasaporte.metadata.rango.toUpperCase()}\n`;
    ticket += `GEN:      ${datosPasaporte.metadata.generacion_actual}\n`;
    ticket += `${lineaSuave}\n`;
    ticket += "   >>> PIN DE ENLACE SECURE <<<  \n";
    ticket += `\n       [  ${pinValidacion}  ]       \n\n`;
    ticket += "* Válido solo para un uso.\n";
    ticket += "* No comparta este PIN en redes públicas.\n";
    ticket += `${lineaSuave}\n`;
    ticket += `Puntos Activos: ${datosPasaporte.puntos_redencion} pts\n`;
    ticket += `Hash de Consenso:\n`;
    // Cortar el hash largo para que no rompa el ancho de la impresora
    ticket += `${datosPasaporte.ultimo_hash_consenso.substring(0, 16)}...\n`;
    ticket += `${lineaDivisoria}\n`;
    ticket += "   EL CÓDIGO ES LA LEY EN LA RED  \n";
    ticket += `${lineaDivisoria}\n`;

    return ticket;
}

// Ejemplo de Ejecución con los datos de Camilo:
const pasaporteCamilo = {
    nombre: "Camilo",
    metadata: { rango: "Aprendiz", generacion_actual: 2 },
    ultimo_hash_consenso: "Q2FtaWxvX0luaWNpYWRvfDUwMHxLLS0t",
    puntos_redencion: 500
};

// Generamos el PIN temporal aleatorio o firmado criptográficamente
const pinSeguridad = "MC-9482-XP"; 
const ticketTexto = generarTicketMercante(pasaporteCamilo, pinSeguridad);

console.log(ticketTexto);