document.addEventListener("DOMContentLoaded", function () {
  var startBtn = document.getElementById("td-wizard-start");
  var wizard = document.getElementById("td-wizard");
  if (!startBtn || !wizard) return;

  var intro = document.getElementById("td-wizard-intro");
  var form = document.getElementById("td-wizard-form");
  var progressItems = wizard.querySelectorAll(".td-wizard-progress li");
  var steps = form.querySelectorAll(".td-wizard-step");
  var confirm = document.getElementById("td-wizard-confirm");
  var confirmText = document.getElementById("td-wizard-confirm-text");
  var summaryList = document.getElementById("td-wizard-summary");
  var currentStep = 1;
  var selectedTeeth = [];

  function makeToothButton(num) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "td-tooth";
    btn.textContent = num;
    btn.setAttribute("data-tooth", num);
    btn.addEventListener("click", function () {
      btn.classList.toggle("is-selected");
      var idx = selectedTeeth.indexOf(num);
      if (btn.classList.contains("is-selected") && idx === -1) {
        selectedTeeth.push(num);
      } else if (!btn.classList.contains("is-selected") && idx !== -1) {
        selectedTeeth.splice(idx, 1);
      }
    });
    return btn;
  }

  function buildToothChart() {
    var upper = document.getElementById("td-tooth-row-upper");
    var lower = document.getElementById("td-tooth-row-lower");
    var i;
    // ISO 3950: upper right (11-18), upper left (21-28)
    for (i = 18; i >= 11; i--) upper.appendChild(makeToothButton(i));
    for (i = 21; i <= 28; i++) upper.appendChild(makeToothButton(i));
    // ISO 3950: lower left (31-38), lower right (41-48)
    for (i = 38; i >= 31; i--) lower.appendChild(makeToothButton(i));
    for (i = 41; i <= 48; i++) lower.appendChild(makeToothButton(i));
  }

  function currentStepEl() {
    return form.querySelector('.td-wizard-step[data-step="' + currentStep + '"]');
  }

  function showStep(n) {
    steps.forEach(function (step) {
      step.hidden = Number(step.getAttribute("data-step")) !== n;
    });
    progressItems.forEach(function (item) {
      var stepNum = Number(item.getAttribute("data-step"));
      item.classList.toggle("is-active", stepNum === n);
      item.classList.toggle("is-done", stepNum < n);
    });
    currentStep = n;
    if (n === 3) renderSummary();
  }

  function validateStep(stepEl) {
    var invalid = stepEl.querySelector(":invalid");
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    return true;
  }

  function fileNames(input) {
    return input && input.files && input.files.length
      ? Array.prototype.map.call(input.files, function (f) { return f.name; })
      : [];
  }

  function renderFileList(input, listEl) {
    listEl.innerHTML = "";
    fileNames(input).forEach(function (name) {
      var li = document.createElement("li");
      li.textContent = name;
      listEl.appendChild(li);
    });
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  function renderSummary() {
    var scanFiles = fileNames(document.getElementById("wz-scan-files"));
    var photoFiles = fileNames(document.getElementById("wz-photo-files"));
    var sortedTeeth = selectedTeeth.slice().sort(function (a, b) { return a - b; });
    var gender = fieldValue("wz-patient-gender");
    var age = fieldValue("wz-patient-age");
    var patientDetails = fieldValue("wz-patient-name");
    if (gender || age) {
      patientDetails += " — ";
      if (gender) patientDetails += gender;
      if (gender && age) patientDetails += ", ";
      if (age) patientDetails += age + " years";
    }
    var rows = [
      ["Dentist", fieldValue("wz-dentist-name") + " — " + fieldValue("wz-practice")],
      ["Contact", fieldValue("wz-email") + " / " + fieldValue("wz-phone")],
      ["Patient", patientDetails],
      ["Restoration", fieldValue("wz-restoration")],
      ["Material", fieldValue("wz-material")],
      ["Shade", fieldValue("wz-shade")],
      ["Teeth", sortedTeeth.length ? sortedTeeth.join(", ") : "None selected"],
      ["Instructions", fieldValue("wz-instructions") || "None"],
      ["Scan Files", scanFiles.length ? scanFiles.join(", ") : "None attached"],
      ["Photos", photoFiles.length ? photoFiles.join(", ") : "None attached"],
      ["Due Date", fieldValue("wz-due-date") || "Not set"]
    ];
    summaryList.innerHTML = "";
    rows.forEach(function (row) {
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      summaryList.appendChild(dt);
      summaryList.appendChild(dd);
    });
  }

  function generateCaseRef() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var ref = "";
    for (var i = 0; i < 6; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "TDL-" + ref;
  }

  startBtn.addEventListener("click", function () {
    intro.hidden = true;
    wizard.hidden = false;
    showStep(1);
    wizard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.querySelectorAll(".td-wizard-next").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validateStep(currentStepEl())) return;
      showStep(currentStep + 1);
    });
  });

  form.querySelectorAll(".td-wizard-back").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(currentStep - 1);
    });
  });

  document.getElementById("wz-scan-files").addEventListener("change", function () {
    renderFileList(this, document.getElementById("wz-scan-list"));
  });
  document.getElementById("wz-photo-files").addEventListener("change", function () {
    renderFileList(this, document.getElementById("wz-photo-list"));
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(currentStepEl())) return;
    // This site is static with no backend: nothing here is actually
    // transmitted or stored. Replace this block with a real submission
    // (fetch to an API, form service, etc.) once a backend exists.
    var ref = generateCaseRef();
    form.hidden = true;
    document.getElementById("td-wizard-progress").hidden = true;
    confirmText.textContent = "Case " + ref + " has been received. Our team will confirm by email and keep you updated at every stage.";
    confirm.hidden = false;
  });

  buildToothChart();
});
