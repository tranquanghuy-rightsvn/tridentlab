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
    btn.setAttribute("data-tooth", num);
    // The number is printed in the chart image, so the button carries it for
    // assistive tech and tooltips instead of visible text.
    btn.setAttribute("aria-label", "Tooth " + num);
    btn.setAttribute("aria-pressed", "false");
    btn.title = "Tooth " + num;
    btn.addEventListener("click", function () {
      btn.classList.toggle("is-selected");
      var on = btn.classList.contains("is-selected");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var idx = selectedTeeth.indexOf(num);
      if (on && idx === -1) {
        selectedTeeth.push(num);
      } else if (!on && idx !== -1) {
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
    // ISO 3950: lower right (48-41) stacked under upper right, then lower left (31-38) under upper left
    for (i = 48; i >= 41; i--) lower.appendChild(makeToothButton(i));
    for (i = 31; i <= 38; i++) lower.appendChild(makeToothButton(i));
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

  var wzStatus = document.getElementById("wz-status");
  var MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // giữ khớp MAX_FILE_BYTES phía server
  var LAB_EMAIL = "cases.thetridentlab@gmail.com";

  function setWz(msg, kind) {
    if (!wzStatus) return;
    wzStatus.hidden = false;
    wzStatus.className = "td-form-status is-" + (kind || "err");
    wzStatus.textContent = msg;
  }
  function fileToB64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result || "");
        resolve(s.slice(s.indexOf(",") + 1));
      };
      r.onerror = function () { reject(new Error("Could not read " + file.name)); };
      r.readAsDataURL(file);
    });
  }
  function pickedFiles() {
    var a = document.getElementById("wz-scan-files");
    var b = document.getElementById("wz-photo-files");
    var out = [];
    if (a && a.files) Array.prototype.forEach.call(a.files, function (f) { out.push({ file: f, kind: "scan" }); });
    if (b && b.files) Array.prototype.forEach.call(b.files, function (f) { out.push({ file: f, kind: "photo" }); });
    return out;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(currentStepEl())) return;

    var submitBtn = form.querySelector('[type="submit"]');
    var hp = document.getElementById("wz-hp");
    var sortedTeeth = selectedTeeth.slice().sort(function (a, b) { return a - b; });
    var picked = pickedFiles();
    var tooBig = picked.filter(function (p) { return p.file.size > MAX_UPLOAD_BYTES; }).map(function (p) { return p.file; });
    var toUpload = picked.filter(function (p) { return p.file.size <= MAX_UPLOAD_BYTES; });

    var payload = {
      _hp: hp ? hp.value : "",
      dentist_name: fieldValue("wz-dentist-name"),
      practice: fieldValue("wz-practice"),
      email: fieldValue("wz-email"),
      phone: fieldValue("wz-phone"),
      patient_name: fieldValue("wz-patient-name"),
      patient_gender: fieldValue("wz-patient-gender"),
      patient_age: fieldValue("wz-patient-age"),
      restoration: fieldValue("wz-restoration"),
      material: fieldValue("wz-material"),
      shade: fieldValue("wz-shade"),
      teeth: sortedTeeth.map(String),
      instructions: fieldValue("wz-instructions"),
      scan_files: fileNames(document.getElementById("wz-scan-files")),
      photo_files: fileNames(document.getElementById("wz-photo-files")),
      due_date: fieldValue("wz-due-date"),
    };

    if (wzStatus) wzStatus.hidden = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.label = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
    }
    function restoreBtn() {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || "Submit Case"; }
    }

    var post = window.tdlPostSubmission ||
      function () { return Promise.resolve({ ok: false, error: "config" }); };

    post("send-case", payload).then(function (res) {
      if (!res || !res.ok || !res.id) {
        restoreBtn();
        setWz(
          res && res.error === "network"
            ? "Couldn't send — please check your connection and try again."
            : (res && res.error) || "Something went wrong. Please try again later.",
          "err"
        );
        return;
      }
      var caseId = res.id;
      var caseRef = res.ref || generateCaseRef();
      var scanLinks = [];
      var photoLinks = [];
      var doneNames = [];  // dòng trạng thái đang chạy trên form
      var failed = [];

      function progress(current) {
        var parts = doneNames.slice();
        if (current) parts.push(current + " …");
        setWz("Uploading files:  " + parts.join("   "), "ok");
      }

      function uploadNext(i) {
        if (i >= toUpload.length) return finish();
        var f = toUpload[i].file;
        var kind = toUpload[i].kind;
        if (submitBtn) submitBtn.textContent = "Uploading " + (i + 1) + " / " + toUpload.length + "…";
        progress(f.name);
        return fileToB64(f)
          .then(function (b64) {
            return post("submission-file", {
              id: caseId,
              name: f.name,
              mimeType: f.type || "application/octet-stream",
              dataB64: b64,
            });
          })
          .then(function (r) {
            if (r && r.ok && r.url) {
              (kind === "scan" ? scanLinks : photoLinks).push({ name: r.fileName || f.name, url: r.url });
              doneNames.push(f.name + " ✓");
            } else {
              failed.push(f.name);
              doneNames.push(f.name + " ✗");
            }
            progress(null);
            return uploadNext(i + 1);
          })
          .catch(function () {
            failed.push(f.name);
            doneNames.push(f.name + " ✗");
            progress(null);
            return uploadNext(i + 1);
          });
      }

      function finish(attempt) {
        attempt = attempt || 1;
        if (submitBtn) submitBtn.textContent = "Finishing…";
        // 1 lần gọi duy nhất kết thúc case -> server có khoá _notified nên
        // gửi ĐÚNG 1 email kèm link, dù client có lỡ gọi lại.
        return post("submission-finish", {
          id: caseId,
          scan_files: scanLinks,
          photo_files: photoLinks,
        })
          .then(function (r) {
            if ((!r || !r.ok) && attempt < 3) return finish(attempt + 1);
            done();
          })
          .catch(function () {
            if (attempt < 3) return finish(attempt + 1);
            done();
          });
      }

      function done() {
        restoreBtn();
        var ref = caseRef;
        var okCount = scanLinks.length + photoLinks.length;

        var line;
        if (okCount && !failed.length && !tooBig.length) {
          line =
            "Case " + ref + " and " + okCount + " file" + (okCount === 1 ? "" : "s") +
            " uploaded successfully. A confirmation email is on its way to you, and our team will keep you updated at every stage.";
        } else {
          line =
            "Case " + ref + " has been received. A confirmation email is on its way to you, and our team will keep you updated at every stage.";
          if (okCount) line = "Case " + ref + " and " + okCount + " file" + (okCount === 1 ? "" : "s") +
            " received. A confirmation email is on its way to you, and our team will keep you updated at every stage.";
        }
        if (failed.length || tooBig.length) {
          var names = failed.concat(
            tooBig.map(function (f) { return f.name + " (over 20 MB)"; })
          );
          line +=
            "\n\nSome files could not be uploaded here — please email them to " +
            LAB_EMAIL + ": " + names.join(", ") + ".";
        }

        form.hidden = true;
        document.getElementById("td-wizard-progress").hidden = true;
        confirmText.textContent = line;
        confirmText.style.whiteSpace = "pre-line";
        confirm.hidden = false;
      }

      uploadNext(0);
    });
  });

  buildToothChart();
});
