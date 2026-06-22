import { createElement } from "../../utils/dom.js";

export function createPwaInstallView({ pwaManager }) {
  const root = createElement("section", {
    className: "pwa-install-card app-card",
    attributes: { "aria-labelledby": "pwa-install-heading" }
  });
  root.innerHTML = `
    <div class="more-section-heading">
      <div>
        <h2 id="pwa-install-heading">Instalacja i tryb offline</h2>
        <p data-text="pwa-install-description"></p>
      </div>
      <span class="pwa-readiness-badge" data-text="pwa-readiness"></span>
    </div>
    <div class="pwa-install-actions">
      <button type="button" class="primary-action" data-action="install-pwa" hidden>Zainstaluj aplikację</button>
      <button type="button" class="secondary-action" data-action="check-pwa-update">Sprawdź aktualizacje</button>
      <button type="button" class="primary-action" data-action="activate-pwa-update" hidden>Wczytaj nową wersję</button>
    </div>
    <div class="pwa-ios-instructions" data-region="pwa-manual-install" hidden>
      <strong>Instalacja na iPhonie lub iPadzie</strong>
      <ol>
        <li>Otwórz tę stronę w Safari.</li>
        <li>Dotknij przycisku Udostępnij.</li>
        <li>Wybierz „Do ekranu początkowego”, a następnie „Dodaj”.</li>
      </ol>
    </div>
    <p class="data-operation-status" data-region="pwa-install-status" role="status" hidden></p>
  `;

  let latestState = pwaManager.getState();

  function showStatus(message, tone = "notice") {
    const status = root.querySelector('[data-region="pwa-install-status"]');
    status.hidden = !message;
    status.dataset.tone = tone;
    status.textContent = message ?? "";
  }

  function render(state) {
    latestState = state;
    const description = root.querySelector('[data-text="pwa-install-description"]');
    const readiness = root.querySelector('[data-text="pwa-readiness"]');
    const install = root.querySelector('[data-action="install-pwa"]');
    const activate = root.querySelector('[data-action="activate-pwa-update"]');
    const manual = root.querySelector('[data-region="pwa-manual-install"]');

    if (!state.supported) {
      description.textContent = "Ta przeglądarka nie obsługuje service workera. Aplikacja wymaga połączenia z internetem.";
      readiness.textContent = "Brak obsługi offline";
      readiness.dataset.tone = "warning";
    } else if (state.installed) {
      description.textContent = state.ready
        ? "Aplikacja jest zainstalowana i przygotowana do działania bez połączenia."
        : "Aplikacja jest zainstalowana. Trwa przygotowywanie plików offline.";
      readiness.textContent = state.ready ? "Gotowa offline" : "Przygotowywanie";
      readiness.dataset.tone = state.ready ? "success" : "notice";
    } else {
      description.textContent = state.ready
        ? "Pliki offline są gotowe. Możesz dodać aplikację do ekranu początkowego."
        : "Po pierwszym pełnym uruchomieniu aplikacja zapisze pliki potrzebne do pracy offline.";
      readiness.textContent = state.ready ? "Offline gotowe" : "Wymaga pierwszego uruchomienia";
      readiness.dataset.tone = state.ready ? "success" : "notice";
    }

    install.hidden = state.installed || !state.installPromptAvailable;
    manual.hidden = state.installed || state.installPromptAvailable;
    activate.hidden = !state.updateAvailable;
    if (state.errorMessage) showStatus(state.errorMessage, "error");
  }

  root.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "install-pwa") {
      button.disabled = true;
      const result = await pwaManager.promptInstall();
      button.disabled = false;
      if (result.outcome === "accepted") showStatus("Instalacja została zaakceptowana.", "success");
      else if (result.outcome === "dismissed") showStatus("Instalacja została anulowana.", "notice");
      else if (result.outcome === "error") showStatus("Nie udało się rozpocząć instalacji.", "error");
    }

    if (action === "check-pwa-update") {
      button.disabled = true;
      button.textContent = "Sprawdzanie…";
      const checked = await pwaManager.checkForUpdate();
      button.disabled = false;
      button.textContent = "Sprawdź aktualizacje";
      showStatus(
        latestState.updateAvailable
          ? "Nowa wersja jest gotowa do wczytania."
          : checked
            ? "Używasz aktualnej wersji aplikacji."
            : "Nie udało się teraz sprawdzić aktualizacji.",
        checked ? "success" : "warning"
      );
    }

    if (action === "activate-pwa-update") {
      button.disabled = true;
      button.textContent = "Aktualizowanie…";
      if (!pwaManager.activateUpdate()) {
        button.disabled = false;
        button.textContent = "Wczytaj nową wersję";
        showStatus("Nowa wersja nie jest już oczekująca. Sprawdź aktualizacje ponownie.", "warning");
      }
    }
  });

  pwaManager.subscribe(render);
  render(latestState);
  return root;
}
