document.addEventListener("DOMContentLoaded", () => {
  const dropzone =
    document.getElementById("dropzone") ||
    document.querySelector(".dropzone");

  const processBtn =
    document.getElementById("processBtn") ||
    [...document.querySelectorAll("button")].find(b =>
      b.textContent.includes("Procesar")
    );

  const fileList =
    document.getElementById("filelist") ||
    document.getElementById("fileList") ||
    document.querySelector(".fileList") ||
    document.querySelector(".files");

  let selectedFiles = [];

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  if (!dropzone) {
    alert("Error: no encuentro la zona de subir archivos.");
    return;
  }

  if (!processBtn) {
    alert("Error: no encuentro el botón Procesar archivos.");
    return;
  }

  dropzone.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    selectedFiles = Array.from(e.target.files);
    mostrarArchivos();
  };

  function mostrarArchivos() {
    if (fileList) {
      fileList.innerHTML = selectedFiles.map(file => `
        <div class="fileItem">
          <strong>${file.name}</strong><br>
          ${(file.size / 1024 / 1024).toFixed(2)} MB
        </div>
      `).join("");
    }

    processBtn.textContent = `Procesar ${selectedFiles.length} archivo(s)`;
  }

  processBtn.onclick = async () => {
    if (selectedFiles.length === 0) {
      alert("Primero selecciona una imagen JPG o PNG.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    for (let i = 0; i < selectedFiles.length; i++) {
      const imageData = await leerArchivo(selectedFiles[i]);
      const img = await cargarImagen(imageData);

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
  };

  function leerArchivo(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  function cargarImagen(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }
});