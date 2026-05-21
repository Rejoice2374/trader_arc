const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export function getTraders() {
  return request("/traders");
}

export function getVaults() {
  return request("/vaults");
}

export function getVault(id) {
  return request(`/vaults/${id}`);
}

export function getPortfolio(wallet) {
  return request(`/user/${wallet}/portfolio`);
}

export function getProtocol() {
  return request("/protocol");
}

export function submitTraderApplication(payload) {
  return request("/traders/applications", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
