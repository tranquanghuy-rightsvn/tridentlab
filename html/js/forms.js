/* Trident Dental Lab — send the 3 public forms to the back office.
 * The endpoint is a separate web app; change the URL in this one place. */
(function () {
  "use strict";

  var ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxeDVsRryUtxXksfy08UX2HowWjKfJjAuaJ4inwNNJpO5Qnnxj31j7quhrsnyFuRBszAg/exec";

  // text/plain keeps it a "simple request" so the browser skips the CORS preflight OPTIONS.
  function postSubmission(type, data) {
    var payload = { type: type };
    Object.keys(data).forEach(function (k) {
      payload[k] = data[k];
    });
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return { ok: false, error: "network" };
      });
  }
  window.tdlPostSubmission = postSubmission;

  function setStatus(box, msg, kind) {
    if (!box) return;
    box.hidden = false;
    box.textContent = msg;
    box.className = "td-form-status is-" + kind;
  }

  // Auto-wire every <form data-tdl-form="<type>"> — collect fields by name, honeypot _hp.
  function wireGenericForms() {
    var forms = document.querySelectorAll("form[data-tdl-form]");
    Array.prototype.forEach.call(forms, function (form) {
      var type = form.getAttribute("data-tdl-form");
      var btn = form.querySelector('[type="submit"]');
      var status = form.querySelector(".td-form-status");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

        var data = {};
        Array.prototype.forEach.call(form.elements, function (el) {
          if (!el.name || el.type === "submit") return;
          if (el.type === "checkbox") data[el.name] = el.checked ? (el.value || "on") : "";
          else data[el.name] = el.value;
        });

        var label = btn ? btn.textContent.trim() : "";
        if (btn) { btn.disabled = true; btn.dataset.label = label; btn.textContent = "Sending…"; }
        setStatus(status, "", "pending");
        status && (status.hidden = true);

        postSubmission(type, data).then(function (res) {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || label; }
          if (res && res.ok) {
            form.reset();
            setStatus(
              status,
              "Thank you — your details have been received" +
                (res.ref ? " (reference " + res.ref + ")" : "") +
                ". The Trident team will be in touch shortly.",
              "ok"
            );
          } else {
            setStatus(
              status,
              (res && res.error === "network")
                ? "Couldn't send — please check your connection and try again."
                : (res && res.error) || "Something went wrong. Please try again later.",
              "err"
            );
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireGenericForms);
  } else {
    wireGenericForms();
  }
})();
