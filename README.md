# ⚡ DECIDE

**Piensa. Decide. Ejecuta.** Motor de microdesafíos educativos de velocidad, precisión y observación.

No es un cuestionario: es una partida de 20 desafíos cortos, cada uno con su propia mecánica (deslizar, tocar, seleccionar, unir con líneas, ordenar, clasificar) y su propio reloj. El motor no sabe de ninguna materia; la demo trae **Historia** (60 desafíos, incluida la independencia del Ecuador), pero el mismo motor sirve para Química, Matemáticas o Lengua con solo escribir contenido.

```
Inicio → 20 desafíos (mecánicas mezcladas) → puntuación → resultados → revisión
```

## Puesta en marcha

```bash
npm install
npm run dev            # http://localhost:5191
npm run dev:host       # para probar en un celular de la misma red
npm run build          # comprobación de tipos + build de producción (dist/)
npm run check:engine   # verifica motor y contenido sin interfaz (ver «Verificación»)
```

Requiere Node 20.19+. Stack: Vite 8 · React 19 · TypeScript 6 (estricto) · Tailwind CSS 4. Sin otras dependencias de ejecución (sonidos sintetizados con Web Audio, iconos SVG en línea, fuentes locales).

## Mecánicas

| Mecánica | Instrucción automática | Cómo se responde |
|---|---|---|
| **Dos opciones** (Verdadero/Falso, Sí/No, Correcto/Incorrecto, A/B) | VERDADERO O FALSO · RESPONDE SÍ O NO… | Deslizar la tarjeta (con física y «latigazo»), tocar uno de los dos botones o **← / →** |
| **Selecciona una** (lista, cuadrícula o mosaico de observación) | SELECCIONA UNA · OBSERVA | Un toque, o teclas **1–9** |
| **Selecciona N** / **Selecciona todas** | SELECCIONA 3 · SELECCIONA TODAS LAS CORRECTAS | Marcar y **Confirmar** («2 / 3 seleccionadas»). Con N fijo no deja pasar de N: avisa con una sacudida (o reemplaza la más antigua, según configuración). **Espacio** marca, **Enter** confirma |
| **Unir conceptos** | UNE LOS CONCEPTOS | Arrastrar una línea de un lado al otro (ratón o dedo), o tocar uno y luego su pareja (también con teclado). Validación `immediate` (cada línea se valida al soltarla; las equivocadas se rechazan y restan) u `on-submit` (se comprueba todo al final) |
| **Ordenar** | ORDENA CORRECTAMENTE | Arrastrar por el asa (animación FLIP) o botones ▲▼ |
| **Clasificar** | CLASIFICA | Arrastrar cada ficha a su grupo, o tocar la ficha y luego el grupo |

El deslizamiento nunca es la única forma de responder: todo se puede hacer con toques y con teclado.

## Reglas de juego

- **Reloj por desafío** (`timeLimit` en segundos). Empieza **después** de la animación de entrada (450 ms): la instrucción ya está en pantalla cuando corre el tiempo. Barra de tensión que pasa a aviso (40 %) y peligro (20 %).
- **Puntuación** (solo si la respuesta es correcta):
  - base **100**;
  - bonus de velocidad **0–50**, lineal según el tiempo que sobró;
  - bonus de racha: **+5** por acierto encadenado desde el segundo, hasta **+25**.
  - Incorrecta o tiempo agotado = **0**, aunque haya sido rapidísima.
  - En «unir» inmediato, cada línea rechazada resta un 15 % de base y velocidad (mínimo 50 %).
- **Rachas** visibles desde x2, sin exagerar.
- **Feedback que no humilla y no detiene el juego.**
  - Acierto: píldora breve (~1 s) con puntos y racha.
  - Error: «No esta vez.» / «Observa nuevamente.» («Casi.» solo si acertó la mitad o más), la respuesta correcta y la explicación.
  - Tiempo: «Se acabó el tiempo.» y la solución.
  - Avanza solo (tiempo de lectura según la longitud de la explicación) o con **Continuar** / **Enter**.
- **Pausa** (botón o pestaña oculta): el reloj se detiene y el desafío se tapa. **Escape** reanuda.
- **Resultados**:
  - correctas / total, precisión, puntos, racha máxima y tiempo promedio;
  - tira «desafío a desafío» (✓ ✕ ⏱) y desglose por mecánica.
- **Revisión**: por defecto solo los errores. Muestra tu respuesta frente a la correcta, la explicación y el tiempo.

## Arquitectura

```
src/
├── types/            Formas de datos: Challenge (unión discriminada), respuestas, config, resultados
├── engine/           Lógica pura, sin React (se prueba en Node)
│   ├── challengeTypes/   Una definición por mecánica: instrucción, preparación (barajado), evaluación, descripción
│   ├── validationEngine  Despacho único por mecánica (la UI nunca evalúa)
│   ├── challengeSelector Banco → partida: filtros, estrategias random | fixed | weighted, sin mecánicas seguidas
│   ├── gameEngine        Máquina de estados (reducer): idle → playing (ready → active → feedback) → finished
│   ├── scoringEngine / streakEngine / timerEngine / analytics
├── config/           Valores por defecto (gameConfig), textos (labels) y opciones por enlace (urlOptions)
├── content/builders  Atajos para escribir contenido (trueFalse, selectExact, matching…)
├── data/             Actividades (solo contenido). data/history = demo
├── challenges/       Una vista React por mecánica + registro + renderer genérico
├── components/       HUD, cabecera, barra de tiempo, feedback, pausa; pantallas inicio/resultados/revisión
├── hooks/            useGame (conecta el reducer con el tiempo real), gestos (usePointerDrag, useSwipe)…
└── services/         Sonido (Web Audio), vibración, preferencias
```

Ideas clave:

- **El motor es puro.**
  - `gameReducer(config, state, action)` no toca el DOM ni el reloj: recibe `performance.now()` en cada acción.
  - Por eso la misma lógica se juega en Node (`check:engine`) y en el navegador.
  - Una respuesta que llega con el tiempo agotado cuenta como tiempo agotado.
- **Partidas reproducibles.** Cada partida tiene una semilla; la misma semilla da los mismos desafíos, en el mismo orden y con las mismas opciones barajadas.
- **Rendimiento.**
  - La barra de tiempo es una animación CSS: React no se re-renderiza por frame. Solo un `requestAnimationFrame` actualiza el número.
  - Hay un único `setTimeout` por fase.
  - Los arrastres escriben estilos directamente, agrupados por frame.
  - Las líneas de «unir» son SVG medido del DOM.
  - Bundle: ~98 kB gzip.
- **Exhaustividad por tipos.** Añadir una mecánica a la unión `Challenge` hace que TypeScript marque cada registro que falta (motor y UI).

## Crear una actividad (otra materia)

1. Crear `src/data/<materia>/` con el banco de desafíos usando los builders:

```ts
import { matching, selectExact, trueFalse } from '../../content/builders';

export const chemistryChallenges = [
  trueFalse({ id: 'tf-agua', prompt: 'El agua es un compuesto.', answer: true, explanation: 'H₂O: dos elementos unidos.' }),
  selectExact({
    id: 'se-metales',
    prompt: '¿Cuáles son metales?',
    options: ['Hierro', 'Oxígeno', 'Cobre', 'Neón'],
    answers: ['Hierro', 'Cobre'], // «SELECCIONA 2» se genera solo
  }),
  matching({
    id: 'mt-simbolos',
    prompt: 'Une cada elemento con su símbolo.',
    pairs: [['Sodio', 'Na'], ['Potasio', 'K'], ['Hierro', 'Fe']],
    validationMode: 'immediate',
  }),
];
```

2. Exportar la actividad (contenido + configuración propia) y registrarla en `src/data/index.ts`:

```ts
export const chemistryActivity: Activity = {
  id: 'quimica-basica',
  title: 'Química',
  subject: 'Ciencias Naturales',
  icon: '⚗️',
  challenges: chemistryChallenges,
  config: { challengeCount: 15, selection: { strategy: 'random' } },
  labels: { resultExcellent: '¡Eres un alquimista!' }, // cualquier texto se puede cambiar
};
```

3. Abrir `?activity=quimica-basica`. Al arrancar en desarrollo, el motor revisa el banco y avisa en consola de ids repetidos, respuestas imposibles, etc.

Los builders ponen tiempos por defecto razonables (binario 7 s, A/B 8 s, elegir 9 s, «selecciona N» 6 + 2·N s, unir 4 + 3,5·parejas s…). Cualquier desafío puede fijar su `timeLimit`, `instruction`, `difficulty`, `topic`, `explanation` y `media` (emoji o imagen con texto alternativo).

## Añadir una mecánica

1. `types/challenge.ts`: interfaz del desafío + su entrada en `AnswerMap` y `PresentationMap`.
2. `engine/challengeTypes/<mecánica>.ts`: `ChallengeDefinition` (instrucción, preparación, evaluación, descripción de respuesta y solución, chequeo de contenido) y registrarla en `challengeTypes/index.ts`.
3. `challenges/<Mecánica>Challenge.tsx`: la vista (recibe `phase`, `result`, `onSubmit`) y registrarla en `challenges/registry.ts` con su icono.
4. `config/labels.ts`: nombre de la mecánica e instrucción.

TypeScript señala cada paso que falte. Ninguna pantalla, ni el HUD, ni la puntuación cambian.

## Configuración

Valores por defecto en `src/config/gameConfig.ts`; cada actividad puede sobrescribir cualquiera en `config`:

| Grupo | Opciones (por defecto) |
|---|---|
| `challengeCount` | 20 |
| `selection` | `strategy`: `random` \| `fixed` \| `weighted` (cuotas por mecánica con `weights`) · `allowDuplicates` (no) · `avoidConsecutiveSameType` (sí) · `shuffleOptions` (sí) · filtros `difficulties`, `topics`, `types` |
| `timer` | `enabled` (sí) · `scale` (1; 1.5 = tiempo ampliado) · `readyDelayMs` (450) · `warningRatio` (0.4) · `dangerRatio` (0.2) · `pauseWhenHidden` (sí) |
| `scoring` | `baseCorrect` 100 · `maxSpeedBonus` 50 · `streakBonusStep` 5 · `maxStreakBonus` 25 |
| `streaks` | `enabled` · `showFrom` 2 |
| `feedback` | `showExplanation` · `correctMs` 950 · `incorrectMs` / `timeoutMs` 2400 · `readingMsPerChar` 32 · `maxMs` 6500 · `allowSkip` |
| `mechanics` | `selectionOverflow`: `block` \| `replace-oldest` · `swipeThreshold` 0.32 |
| `effects` | `sound` (no; el estudiante lo activa y se recuerda) · `haptics` (sí) |

La demo de Historia usa `weighted` con 6 binarios, 4 de elegir una, 4 de selección múltiple, 3 de unir, 2 de ordenar y 1 de clasificar: cada partida mezcla todas las mecánicas.

### Personalizar por enlace (docentes)

Sin tocar código, un enlace puede ajustar la partida:

| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `activity` | `?activity=historia-demo` | Actividad |
| `count` | `&count=10` | Desafíos por partida (1–50) |
| `mechanics` | `&mechanics=matching,ordering` | Solo esas mecánicas |
| `difficulty` | `&difficulty=easy,medium` | Solo esas dificultades |
| `time` | `&time=1.5` · `&time=off` | Tiempo ampliado ×1,5 (0,5–4) · modo práctica sin reloj (sin bonus de velocidad) |

Los valores no válidos se ignoran. Si el banco filtrado tiene menos desafíos que `count`, la partida usa los que haya, y la portada muestra la cantidad real.

## Datos para el docente

Al terminar, `useGame().report` (`GameReport`) contiene:

- aciertos, errores y tiempos agotados;
- precisión, puntos, racha máxima, tiempo promedio y duración;
- desglose **por mecánica** y **por tema**;
- ids de los desafíos fallados.

Cada `ChallengeResult` guarda la respuesta exacta, la precisión parcial, el tiempo usado y el desglose de puntos. Está listo para enviarse a un panel docente o a un LMS.

## Accesibilidad

- Todo se juega con teclado:
  - **Enter** comienza y continúa;
  - **← / →** en dos opciones y **1–9** al elegir;
  - **Espacio / Enter** sobre fichas, líneas y grupos;
  - **Escape** reanuda la pausa.
- En inicio, resultados y revisión el foco va al título de la pantalla.
- Una región `aria-live` anuncia cada desafío al arrancar el reloj y su resultado (con la solución).
- El color nunca es la única pista: siempre hay ✓ ✕ ⏱ e iconos con texto accesible.
- Se respeta `prefers-reduced-motion` y se permite el zoom.
- Las opciones y botones principales miden 44 px o más. Los controles secundarios (HUD, flechas ▲▼, tira de resultados) nunca bajan del mínimo de 24 px de WCAG 2.2.
- Tiempo ajustable (`time=1.5`, `time=off`), pausa en cualquier momento y pausa automática al cambiar de pestaña.
- El sonido es opcional y nunca transmite información exclusiva. La vibración es solo un refuerzo.

## Verificación

- `npm run build`: TypeScript estricto + build sin errores.
- `npm run check:engine`:
  - el banco no tiene problemas;
  - cada solución se evalúa como correcta y una alterada como incorrecta;
  - 200 semillas dan 20 desafíos únicos, sin mecánicas seguidas y con las cuotas exactas;
  - la semilla reproduce la partida y el reducer juega una partida perfecta;
  - la puntuación es rápida 148 / lenta 108 / incorrecta 0;
  - el enlace docente filtra, ajusta tiempo y permite el modo sin reloj;
  - «Casi.» aparece solo con acierto parcial.
- Pruebas de extremo a extremo en Chrome (360×800 táctil y 1280×800 con ratón). Se juegan partidas completas de 20 desafíos por la interfaz:
  - deslizar, teclado, toques, arrastre de líneas y fichas, exceso de selección;
  - pausa con reloj congelado y tiempo agotado;
  - resultados, revisión, jugar de nuevo y salir.
  - Además, una partida solo con teclado de las 6 mecánicas.
  - Sin errores de consola.

## Próximos pasos sugeridos

- Estrategia **adaptativa** en `challengeSelector` (más desafíos de las mecánicas/temas con más errores).
- Más materias reutilizando el motor (Química, Lengua, Matemáticas).
- Panel docente: enviar `GameReport` a un servicio (o xAPI/LTI para un LMS).
- Mecánicas nuevas: «encuentra el error» en un texto, completar huecos, línea de tiempo.
