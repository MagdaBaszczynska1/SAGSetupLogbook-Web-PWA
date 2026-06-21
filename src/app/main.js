import { ROUTES } from "./routes.js";
import { createRouter } from "./router.js";
import { createAppShell } from "../components/layout/app-shell.js";
import { createMeasurementView } from "../views/measurement/measurement-view.js";
import { createHistoryView } from "../views/history/history-view.js";
import { createJournalView } from "../views/journal/journal-view.js";
import { createMoreView } from "../views/more/more-view.js";

const viewFactories = Object.freeze({
  measurement: createMeasurementView,
  history: createHistoryView,
  journal: createJournalView,
  more: createMoreView
});

function bootstrap() {
  const mountPoint = document.querySelector("#app");
  if (!mountPoint) {
    throw new Error("Nie znaleziono punktu montowania aplikacji #app.");
  }

  let shell;
  const router = createRouter({
    onRouteChange(route) {
      const createView = viewFactories[route.id];
      if (!createView) {
        throw new Error(`Brak widoku dla trasy: ${route.id}`);
      }
      shell.renderRoute(route, createView());
    }
  });

  shell = createAppShell({
    routes: ROUTES,
    onNavigate: routeId => router.navigate(routeId)
  });

  mountPoint.replaceChildren(shell.element);
  router.start();
}

try {
  bootstrap();
} catch (error) {
  console.error("Nie udało się uruchomić aplikacji.", error);
  const mountPoint = document.querySelector("#app");
  if (mountPoint) {
    mountPoint.innerHTML = `
      <main class="fatal-error" role="alert">
        <h1>Nie udało się uruchomić aplikacji</h1>
        <p>Odśwież stronę. Jeżeli problem się powtórzy, aplikacja wymaga poprawki.</p>
      </main>
    `;
  }
}
