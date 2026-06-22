import { ROUTES } from "./routes.js";
import { createRouter } from "./router.js";
import { createDataContext } from "./data-context.js";
import { createAppShell } from "../components/layout/app-shell.js";
import { createMeasurementView } from "../views/measurement/measurement-view.js";
import { createHistoryView } from "../views/history/history-view.js";
import { createJournalView } from "../views/journal/journal-view.js";
import { createMoreView } from "../views/more/more-view.js";

async function bootstrap() {
  const mountPoint = document.querySelector("#app");
  if (!mountPoint) throw new Error("Nie znaleziono punktu montowania aplikacji #app.");

  mountPoint.innerHTML = '<main class="app-loading" role="status"><strong>Uruchamianie aplikacji…</strong><span>Otwieranie bazy danych</span></main>';
  const dataContext = await createDataContext();
  let router;

  const viewFactories = Object.freeze({
    measurement: () => createMeasurementView(dataContext),
    history: () => createHistoryView({
      ...dataContext,
      onStartMeasurement: () => router.navigate("measurement"),
      onAddRide: measurement => {
        dataContext.rideDraftStore.setSourceMeasurement(measurement);
        router.navigate("journal");
      }
    }),
    journal: () => createJournalView({
      ...dataContext,
      onManageBikes: () => router.navigate("more")
    }),
    more: () => createMoreView(dataContext)
  });

  const views = new Map();
  const getView = routeId => {
    if (!views.has(routeId)) {
      const factory = viewFactories[routeId];
      if (!factory) throw new Error(`Brak widoku dla trasy: ${routeId}`);
      views.set(routeId, factory());
    }
    return views.get(routeId);
  };

  let shell;
  router = createRouter({
    onRouteChange(route) {
      shell.renderRoute(route, getView(route.id));
    }
  });

  shell = createAppShell({
    routes: ROUTES,
    onNavigate: routeId => router.navigate(routeId)
  });

  mountPoint.replaceChildren(shell.element);
  router.start();
}

bootstrap().catch(error => {
  console.error("Nie udało się uruchomić aplikacji.", error);
  const mountPoint = document.querySelector("#app");
  if (mountPoint) {
    mountPoint.innerHTML = '<main class="fatal-error" role="alert"><h1>Nie udało się uruchomić aplikacji</h1><p>Odśwież stronę. Jeżeli problem się powtórzy, sprawdź, czy przeglądarka pozwala tej stronie zapisywać dane.</p></main>';
  }
});
