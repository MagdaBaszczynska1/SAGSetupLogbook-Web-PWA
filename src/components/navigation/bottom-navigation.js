import { createElement } from "../../utils/dom.js";

export function createBottomNavigation(routes, onNavigate) {
  const navigation = createElement("nav", {
    className: "bottom-navigation",
    attributes: { "aria-label": "Główna nawigacja" }
  });

  const buttons = new Map();

  for (const route of routes) {
    const icon = createElement("span", {
      className: "bottom-navigation__icon",
      text: route.icon,
      attributes: { "aria-hidden": "true" }
    });
    const label = createElement("span", {
      className: "bottom-navigation__label",
      text: route.tabLabel
    });
    const button = createElement("button", {
      className: "bottom-navigation__item",
      attributes: {
        type: "button",
        "data-route-id": route.id,
        "aria-label": route.tabLabel
      },
      children: [icon, label]
    });

    button.addEventListener("click", () => onNavigate(route.id));
    buttons.set(route.id, button);
    navigation.append(button);
  }

  function setActive(routeId) {
    for (const [id, button] of buttons) {
      const active = id === routeId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    }
  }

  return Object.freeze({ element: navigation, setActive });
}
