"use strict";

(() => {
  const enabled = document.body?.dataset.published === "true";
  window.__POWERPLATFORM_PUBLISHED__ = enabled;
  if (!enabled) {
    window.__POWERPLATFORM_PUBLISHED_READY__ = Promise.resolve(null);
    return;
  }

  const nativeFetch = window.fetch.bind(window);
  const ready = nativeFetch("./data/published-fixture.json", { cache: "no-store" }).then(response => {
    if (!response.ok) throw new Error(`Published fixture is unavailable: ${response.status}`);
    return response.json();
  });
  window.__POWERPLATFORM_PUBLISHED_READY__ = ready;

  const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

  window.fetch = async (resource, options = {}) => {
    const url = new URL(typeof resource === "string" ? resource : resource.url, location.href);
    if (!url.pathname.startsWith("/api/local")) return nativeFetch(resource, options);
    const method = String(options.method || (typeof resource === "object" && resource.method) || "GET").toUpperCase();
    if (method !== "GET") return jsonResponse({ error: "Публичная версия работает только для просмотра." }, 403);

    const fixture = await ready;
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/api/local/summary") return jsonResponse({ status: "PUBLISHED", checks: {} });
    if (path === "/api/local/pas/projects") return jsonResponse([fixture.project]);
    if (path === `/api/local/pas/projects/${fixture.project.id}/models`) return jsonResponse([fixture.model]);
    if (path === `/api/local/pas/models/${fixture.model.id}/schema`) return jsonResponse(fixture.schema);
    if (path === `/api/local/pas/models/${fixture.model.id}`) return jsonResponse(fixture.model);
    if (path === "/api/local/pas/nodes") return jsonResponse({ items: fixture.nodeDefinitions, total: fixture.nodeDefinitions.length });
    if (path === "/api/local/pas/executions") return jsonResponse([]);
    if (path === "/api/local/dof/ontologies") return jsonResponse([fixture.ontology]);
    if (path === `/api/local/dof/ontologies/${fixture.ontology.id}`) return jsonResponse(fixture.ontology);
    if (path === "/api/local/codex/status") return jsonResponse({ connected: false, available: false });
    return jsonResponse({ error: `Маршрут недоступен в публичном просмотре: ${path}` }, 404);
  };
})();
