const url = "http://localhost:3000/api/health";
(async () => {
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("HEALTH status:", res.status);
    console.log(text);
  } catch (err) {
    console.error("HEALTH error:", err?.message || err);
    process.exit(1);
  }
})();
