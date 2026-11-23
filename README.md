# YUMM IA · Asistente de Investigación Metodológica

Asistente digital que acompaña a estudiantes de la **Universidad Tecnológica de Cancún** en la construcción de protocolos de investigación, a través de **29 módulos secuenciales** organizados en 6 fases: desde la delimitación del tema hasta la simulación de la defensa de tesis.

**Autores:** Dr. Francisco José Medina Ocampo · Dra. Elda Verónica Martínez Mena
**Institución:** Universidad Tecnológica de Cancún · Versión 1.0 · Noviembre 2026

## Características

- **Bloqueo secuencial:** el Módulo N+1 se habilita solo cuando el Módulo N pasa todas sus validaciones (`is_valid === true`).
- **Validaciones heurísticas en tiempo real:** verbos en infinitivo y Taxonomía de Bloom digital, coherencia objetivo–pregunta, formato de hipótesis, DOI, APA 7, cobertura de objetivos, etc.
- **Lógica condicional por enfoque:** cualitativo omite Hipótesis (9), Variables (18) y Operacionalización (18.5) y activa Categorías (19); cuantitativo hace lo contrario; mixto integra ambos.
- **Calculadora Omega de McDonald (ω):** a partir de cargas factoriales, matriz de correlaciones o datos brutos (análisis de ejes principales de un factor), con α de Cronbach, interpretación automática y recomendaciones.
- **Validaciones cruzadas:** Enfoque–Paradigma, Nivel–Alcance, Variable–Escala, Objetivo–Hipótesis, Diseño–Método y Operacionalización.
- **Exportación:** protocolo completo a Word y PDF, matriz de operacionalización a Excel/Word y datos estructurados a JSON (importables).
- **Sin servidor:** HTML, CSS y JavaScript vanilla. Los datos se guardan en `localStorage` (`yumm_ia_state`).

## Fases y módulos

| Fase | Módulos |
|---|---|
| 1. Fundamentos | 1 Delimitación del tema · 2 Planteamiento del problema · 3 Objetivos · 4 Justificación · 5 Estado del arte |
| 2. Marco referencial | 6 Antecedentes · 7 Marco teórico · 8 Marco conceptual · 9 Hipótesis (condicional) |
| 3. Diseño metodológico macro | 10 Enfoque · 11 Paradigma · 12 Tipo · 13 Nivel · 14 Diseño según objetivos · 15 Método · 16 Modalidad · 17 Población y muestra |
| 4. Operacionalización y medición | 18 Variables · 18.5 Operacionalización · 19 Categorías (condicional) · 20 Indicadores · 21 Técnicas, instrumentos y ω |
| 5. Trabajo de campo y análisis | 22 Recolección de datos · 23 Análisis de datos · 24 Resultados · 25 Discusión |
| 6. Cierre y formalización | 26 Conclusiones · 27 Referencias · 28 Estructura final · 29 Preparación para la defensa |

## Uso local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python -m http.server 8080
```

## Estructura

```
index.html        Estructura, portada y vistas
css/styles.css    Sistema visual (paleta UT Cancún, animaciones)
js/modules.js     Definición de los 29 módulos, catálogos y cálculos
js/app.js         Motor: estado, navegación, validación, exportación
assets/           Logotipos
```
