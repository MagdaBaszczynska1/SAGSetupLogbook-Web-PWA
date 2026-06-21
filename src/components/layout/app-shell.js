import { createElement, replaceChildren } from "../../utils/dom.js";
import { createBottomNavigation } from "../navigation/bottom-navigation.js";

export function createAppShell({ routes, onNavigate }) {
  const leadingSlot = createElement("div", { className: "app-header__slot" });
  const trailingSlot = createElement("div", { className: "app-header__slot app-header__slot--trailing" });
  const title = createElement("h1", {
    className: "app-header__title",
    text: "SAG Setup Logbook"
  });

  const header = createElement("header", {
    className: "app-header",
    children: [leadingSlot, title, trailingSlot]
  });

  const content = createElement("main", {
    className: "app-content",
    attributes: { id: "main-content", tabindex: "-1" }
  });

  const navigation = createBottomNavigation(routes, onNavigate);

  const element = createElement("div", {
    className: "app-shell",
    children: [header, content, navigation.element]
  });

  function renderRoute(route, view) {
    title.textContent = route.title;
    document.title = `${route.tabLabel} — SAG Setup Logbook`;
    navigation.setActive(route.id);
    replaceChildren(leadingSlot, [view.headerActions?.leading]);
    replaceChildren(trailingSlot, [view.headerActions?.trailing]);
    replaceChildren(content, [view]);
    content.focus({ preventScroll: true });
  }

  return Object.freeze({ element, renderRoute });
}
