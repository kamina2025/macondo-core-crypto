async function ejecutarAuditoriaFisica() {
    const monitor = document.getElementById("monitorTerminal");
    const pubKey = document.getElementById("pubKeyInput").value.trim();
    const qrString = document.getElementById("qrStringInput").value.trim();

    // Validación de campos vacíos antes de computar en RAM
    if (!pubKey || !qrString) {
        monitor.innerHTML = `
                    <div class="resultado-fallo">
                        <h3>Error de Entrada</h3>
                        <p>Faltan datos críticos en el altar. Asegúrate de cargar tanto la llave pública como el string del QR.</p>
                    </div>`;
        return;
    }

    monitor.innerHTML = `<div class="estado-inicial">[Computando verificación asíncrona en RAM...]</div>`;

    // Ejecutar la validación utilizando el módulo lógico de Macondo
    const resultado = await MacondoQRTermico.validarSelloQR(qrString, pubKey);

    if (resultado.esValido) {
        // Formatear fecha del timestamp del ticket
        const fechaTicket = new Date(resultado.datos.t * 1000).toLocaleString();

        monitor.innerHTML = `
                    <div class="resultado-exito">
                        <h3>🟢 AUTENTICIDAD TOTAL CONVERGENTE</h3>
                        <p>La firma criptográfica es legítima. El registro no ha sido alterado manualmente.</p>
                        <table class="tabla-datos">
                            <tr>
                                <td>Mercante ID:</td>
                                <td><span class="badge-id">${resultado.datos.id}</span></td>
                            </tr>
                            <tr>
                                <td>Monto Transado:</td>
                                <td><strong>${resultado.datos.m} Puntos</strong></td>
                            </tr>
                            <tr>
                                <td>PIN Verificación:</td>
                                <td><code>${resultado.datos.p}</code></td>
                            </tr>
                            <tr>
                                <td>Último Hash Consenso:</td>
                                <td><small>${resultado.datos.h}</small></td>
                            </tr>
                            <tr>
                                <td>Fecha de Forja:</td>
                                <td>${fechaTicket}</td>
                            </tr>
                            <tr>
                                <td>Key ID PGP:</td>
                                <td><code>${resultado.keyId}</code></td>
                            </tr>
                        </table>
                    </div>`;
    } else {
        monitor.innerHTML = `
                    <div class="resultado-fallo">
                        <h3>🚨 ALERTA DE FRAUDE / ALTERACIÓN</h3>
                        <p>La verificación matemática ha fallado de forma contundente. El ticket es falso, la firma no corresponde al emisor, o el payload fue modificado.</p>
                        <table class="tabla-datos">
                            <tr>
                                <td>Causa del Fallo:</td>
                                <td><span style="color: var(--rojo-alerta);">${resultado.error || "Firma PGP No Válida"}</span></td>
                            </tr>
                        </table>
                    </div>`;
    }
}
