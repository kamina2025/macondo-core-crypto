import { PerfilLogica } from "../src/perfil-logica.js?v=999";
import { GremioLogica } from "../src/gremio-logica.js?v=999";

const inputsMapeo = {
    alias: document.getElementById("alias"),
    hardware: document.getElementById("hardwareNodo"),
    almacenamiento: document.getElementById("almacenamientoGB"),
    aporte: document.getElementById("aporteMaterial"),
    statusBox: document.getElementById("statusLiveBox")
};

const preview = document.getElementById("previewCedula");
const contenedorDinamico = document.getElementById("contenedorDinamico");

// Lector de Cédulas Existentes
document.getElementById("fileCargarCedula").addEventListener("change", (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (evento) => {
        try {
            const jsonParsed = JSON.parse(evento.target.result);
            preview.value = JSON.stringify(jsonParsed, null, 2);

            // 1. Cargar el mapa visual base
            PerfilLogica.cargarPerfilVisual(jsonParsed, inputsMapeo);
            document.getElementById("passContainer").style.opacity = "0.4";

            // Sincronizar el selector de rango con lo que viene del JSON cargado
            if (jsonParsed.metadata?.rango_actual && document.getElementById("rangoSimulado")) {
                document.getElementById("rangoSimulado").value = jsonParsed.metadata.rango_actual;
            }

            // 2. DISPARADOR DUAL: Evaluar el rango del certificado running en RAM
            const rango = jsonParsed.metadata?.rango_actual || "Iniciado";
            const gremio = jsonParsed.registro_meritos_termodinamicos?.aporte_principal || "";

            if (rango === "Iniciado") {
                GremioLogica.mostrarPasarelaIniciado(contenedorDinamico);
            } else {
                GremioLogica.mostrarPizarraCustodio(contenedorDinamico, gremio);
            }
        } catch (err) {
            alert("El archivo seleccionado no es un perfil JSON válido.");
        }
    };
    lector.readAsText(archivo);
});

// Disparador de Forja Inicial
document.getElementById("btnEjecutarForja").addEventListener("click", async () => {
    const alias = inputsMapeo.alias.value.trim();
    const pass = document.getElementById("passphrase").value;

    const datosFisicos = {
        hardware: inputsMapeo.hardware.value.trim(),
        almacenamiento: parseInt(inputsMapeo.almacenamiento.value) || 10,
        aporte: inputsMapeo.aporte.value
    };

    // El archivo src/perfil-logica.js leerá el elemento "rangoSimulado" internamente
    await PerfilLogica.ejecutarForjaBase(alias, pass, datosFisicos, preview, inputsMapeo.statusBox);
    contenedorDinamico.style.display = "none";
    document.getElementById("passContainer").style.opacity = "1";
});
