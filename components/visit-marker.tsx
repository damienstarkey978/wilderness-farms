"use client";

import { useEffect } from "react";

const STORAGE_KEY = "wf_visitor";

export function VisitMarker() {
  useEffect(() => {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);
  return null;
}
