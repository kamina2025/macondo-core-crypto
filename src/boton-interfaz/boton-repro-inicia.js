import { MercanteLogica } from "../src/mercante-logica.js?v=999";

let discoteca = null;
let trackSeleccionado = null;

const monitor = (texto, err = false) => {
    const c = document.getElementById("consolaIniciado");
    c.style.borderColor = err ? "#ff3333" : "#00ffcc";
    c.innerHTML = err ? `❌ ${texto}` : `🪵 ${texto}`;
};

// LECTURA DEL JSON
document.getElementById("archivoPublico").addEventListener("change", (e) => {
    if (!e.target.files[0]) return;
    const lector = new FileReader();
    lector.onload = (ev) => {
        try {
            discoteca = JSON.parse(ev.target.result);
            monitor(
                `Catálogo de Sinfonía sincronizado. Recursos detectados: ${discoteca.catalogo_recursos?.length || 0}`
            );
            dibujarPistas();
        } catch (err) {
            monitor("Error al procesar el catálogo de la red.", true);
        }
    };
    lector.readAsText(e.target.files[0]);
});

// GENERAR LISTA VISUAL
function dibujarPistas() {
    const box = document.getElementById("contenedorTracks");
    box.innerHTML = "";
    const pistas = discoteca.catalogo_recursos || [];

    if (pistas.length === 0) {
        box.innerHTML = "<p>No hay pistas validadas en este catálogo.</p>";
        return;
    }

    document.getElementById("panelContenido").style.display = "block";

    pistas.forEach((p) => {
        const div = document.createElement("div");
        div.className = "pista-item";
        div.innerHTML = `
                    <div>
                        <code style="color:#00ffcc;">${p.id_transaccion}</code>
                        <span style="color:#666; font-size:0.8rem; margin-left:10px;">[Cifrado XOR]</span>
                    </div>
                    <button class="btnAccederPista" data-id="${p.id_transaccion}" style="padding:2px 8px; font-size:0.75rem;">🎧 Escuchar</button>
                `;
        box.appendChild(div);
    });

    document.querySelectorAll(".btnAccederPista").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            trackSeleccionado = pistas.find((p) => p.id_transaccion === id);

            // Ocultamos la consola limpia y desplegamos el modal de verificación de PIN
            document.getElementById("modalBloqueo").style.display = "block";
            monitor(`Pista [${id}] en espera de token de desbloqueo.`);
        });
    });
}

// VALIDACIÓN Y DESBLOQUEO XOR SIMULADO
document.getElementById("btnDesbloquearConPin").addEventListener("click", () => {
    if (!trackSeleccionado) return;
    const pin = document.getElementById("inputPinCliente").value.trim();

    try {
        // 1. Validamos y quemamos el PIN en la boveada del comerciante
        const verificacion = MercanteLogica.validarYConsumirPin(pin, "Sinfononia");

        monitor("⏳ PIN Correcto. Solicitando fragmentos automáticos a los Faros de red...");

        // 2. Simulación de recuperación automatizada: Como el PIN es válido, el Faro
        // provee las llaves de Shamir de forma silenciosa para resolver la recta en la RAM
        const baseLlaves = JSON.parse(localStorage.getItem("boveda_llaves_dht_privadas")) || {};
        const llavesDelActivo = baseLlaves[trackSeleccionado.id_transaccion];

        if (!llavesDelActivo) {
            throw new Error("Faros fuera de línea: Las llaves de este activo no están registradas en la DHT local.");
        }

        // 3. Reconstruimos la recta polinomial de manera transparente en la RAM
        const p1 = JSON.parse(atob(llavesDelActivo.nodo_A));
        const p2 = JSON.parse(atob(llavesDelActivo.nodo_B));
        const pendiente = (p2.y - p1.y) / (p2.x - p1.x);
        const semillaReconstruida = p1.y - p1.x * pendiente;
        const claveClonada = "K_" + Math.round(semillaReconstruida);

        // 4. Rompemos el cifrado XOR en caliente
        const stringDecodificado = decodeURIComponent(atob(trackSeleccionado.payload_bloqueado));
        let enlaceLimpio = "";
        for (let i = 0; i < stringDecodificado.length; i++) {
            let charCode = stringDecodificado.charCodeAt(i) ^ claveClonada.charCodeAt(i % claveClonada.length);
            enlaceLimpio += String.fromCharCode(charCode);
        }

        // 5. Éxito absoluto: Entrega del Magnet Link
        document.getElementById("modalBloqueo").style.display = "none";
        document.getElementById("inputPinCliente").value = "";

        monitor(`🎉 <strong>¡REPRODUCTOR ACTIVADO CON PIN!</strong><br><br>
                Emitido originalmente por: <span style="color:#00ffcc;">${verificacion.emitido_por}</span><br>
                Enlace WebTorrent Revelado: <code style="color:#39ff14; word-break:break-all;">${enlaceLimpio}</code><br><br>
                <span style="color:#aaa; font-size:0.85rem;">Streaming P2P iniciado en el patio del Iniciado.</span>`);
    } catch (err) {
        monitor(err.message, true);
    }
});
