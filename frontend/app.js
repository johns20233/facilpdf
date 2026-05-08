 document.addEventListener("DOMContentLoaded", () => {
  let selectedFiles = [];

  const dropzone =
    document.getElementById("dropzone") ||
    document.querySelector(".dropzone");

  const fileList =
    document.getElementById("filelist") ||
    document.getElementById("fileList") ||
    document.querySelector(".fileList") ||
    document.querySelector(".files") ||
    document.querySelector(".file-list");

  const processBtn =
    document.getElementById("processBtn") ||
    [...document.querySelectorAll("button, .btn, a")].find(el =>
      el.textContent.toLowerCase().includes("procesar")
    );

  const emailInput =
    document.querySelector('input[type="email"]') ||
    document.querySelector('input');

  const subscribeBtn =
    [...document.querySelectorAll("button, .btn, a")].find(el =>
      el.textContent.toLowerCase().includes("suscrib")
    );

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  if (dropzone) {
    dropzone.style.cursor = "pointer";

    dropzone.addEventListener("click", () => {
      fileInput.click();
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("active");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("active");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("active");

      selectedFiles = Array.from(e.dataTransfer.files).filter(file =>
        file.type === "image/jpeg" || file.type === "image/png"
      );

      showFiles();
    });
  } else {
    alert("No se encontró la zona para subir archivos.");
  }

  fileInput.addEventListener("change", (e) => {
    selectedFiles = Array.from(e.target.files).filter(file =>
      file.type === "image/jpeg" || file.type === "image/png"
    );

    showFiles();
  });

  function showFiles() {
    if (fileList) {
      if (selectedFiles.length === 0) {
        fileList.innerHTML = "Todavía no hay archivos cargados.";
      } else {
        fileList.innerHTML = selectedFiles.map(file => `
          <div class="fileItem">
            <strong>${file.name}</strong><br>
            ${(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        `).join("");
      }
    }

    if (processBtn) {
      processBtn.textContent = selectedFiles.length > 0
        ? `Procesar ${selectedFiles.length} archivo(s)`
        : "Procesar archivos";
    }
  }

  if (processBtn) {
    processBtn.addEventListener("click", async () => {
      if (selectedFiles.length === 0) {
        alert("Primero selecciona una imagen JPG o PNG.");
        return;
      }

      if (!window.jspdf) {
        alert("Error: jsPDF no está cargado. Revisa index.html.");
        return;
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();

      for (let i = 0; i < selectedFiles.length; i++) {
        const imageData = await readFile(selectedFiles[i]);
        const img = await loadImage(imageData);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let imgWidth = pageWidth;
        let imgHeight = (img.height * imgWidth) / img.width;

        if (imgHeight > pageHeight) {
          imgHeight = pageHeight;
          imgWidth = (img.width * imgHeight) / img.height;
        }

        if (i > 0) pdf.addPage();

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imageData, "JPEG", x, y, imgWidth, imgHeight);
      }

      pdf.save("ComboPDF.pdf");
    });
  }

  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", () => {
      const email = emailInput ? emailInput.value.trim() : "";

      if (!email || !email.includes("@")) {
        alert("Escribe un email válido.");
        return;
      }

      localStorage.setItem("combopdf_email", email);
      alert("Suscripción registrada correctamente.");
    });
  }

  function readFile(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }
});