/* Consenso ai cookie di statistica (26/10/2026): Google Analytics 4 in modalità «base».
   Google si carica SOLO dopo «Accetta»: prima del clic il sito non contatta Google e non salva cookie.
   Regole del Garante privacy (linee guida cookie, 10/6/2021): «Rifiuta» comodo quanto «Accetta», la X vale come rifiuto,
   scelta ricordata 6 mesi, sempre modificabile dal link «Gestisci i cookie» (data-consenso) nel piè di pagina e nella pagina Cookie.
   L'ID di Analytics arriva da site/sito.json ("ga4") tramite data-ga sullo script. */
(function () {
  var me = document.currentScript, ID = me && me.dataset.ga;
  if (!ID || !/^G-[A-Z0-9]+$/.test(ID)) return;
  var K = "tcj-consenso", SEI_MESI = 182 * 864e5, caricato = false, box = null;

  function leggi() {
    try { var v = JSON.parse(localStorage.getItem(K) || "null"); return v && (v.s === "si" || v.s === "no") && Date.now() - v.t < SEI_MESI ? v.s : null; }
    catch (e) { return null; }
  }
  function salva(s) { try { localStorage.setItem(K, JSON.stringify({ s: s, t: Date.now() })); } catch (e) {} }

  function avvia() {
    if (caricato) return; caricato = true; window["ga-disable-" + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // solo statistiche: niente pubblicità né profilazione
    gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("set", "ads_data_redaction", true);
    gtag("js", new Date());
    gtag("config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
  }
  function ferma() {
    window["ga-disable-" + ID] = true;
    if (window.gtag) gtag("consent", "update", { analytics_storage: "denied" });
    // via i cookie _ga già salvati (sul dominio con e senza www)
    var dom = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim(); if (!/^_ga/.test(n)) return;
      ["", "; domain=" + location.hostname, "; domain=." + dom].forEach(function (d) { document.cookie = n + "=; Max-Age=0; path=/" + d; });
    });
  }

  function scegli(s) {
    salva(s);
    if (s === "si") avvia(); else ferma();
    chiudi();
  }
  function chiudi() {
    if (!box) return; var b = box; box = null;
    b.classList.remove("on"); setTimeout(function () { b.remove(); }, 400);
  }
  function apri() {
    if (box) return;
    box = document.createElement("div");
    box.className = "consenso"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Cookie di statistica");
    // testo corto e generico (Floriano, 26/10: «più semplice, non bisogna dire troppe cose alla gente»); i dettagli sono in cookie.html
    box.innerHTML = '<button class="consenso-x" type="button" aria-label="Chiudi: rifiuto">&times;</button>' +
      '<p>Usiamo i cookie, anche di terze parti, per migliorare il sito. Puoi accettarli o rifiutarli. <a href="cookie.html">Dettagli</a></p>' +
      '<div class="consenso-b"><button class="btn ghost" type="button" data-s="no">Rifiuta</button><button class="btn" type="button" data-s="si">Accetta</button></div>';
    box.addEventListener("click", function (e) {
      var t = e.target.closest("[data-s], .consenso-x"); if (!t) return;
      scegli(t.dataset.s === "si" ? "si" : "no");
    });
    document.body.appendChild(box);
    void box.offsetHeight; box.classList.add("on");   // reflow forzato: l'entrata parte anche in una scheda in secondo piano (requestAnimationFrame lì non scatta)
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-consenso]"); if (!a) return;
    e.preventDefault(); apri();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box && box.contains(document.activeElement)) scegli("no"); });

  var s = leggi();
  if (s === "si") avvia();
  else if (s === null) apri();
})();
