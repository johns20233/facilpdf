const dropzone = document.getElementById("dropzone");
const processBtn = document.getElementById("processBtn");
const fileList =
  document.getElementById("fileList") ||
  document.getElementById("filelist") ||
  document.querySelector(".fileList") ||
  document.querySelector(".filelist");

let selectedFiles = [];

let fileInput = document.querySelector('input[type="file"]');

if (!fileInput) {
  fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/jpeg,image/png";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);
}

dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  selectedFiles = Array.from(e.target.files);
  showFiles();
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  selectedFiles = Array.from(e.dataTransfer.files).filter(file =>
    file.type === "image/jpeg" || file.type === "image/png"
  );
  showFiles();
});

function showFiles() {
  if (!fileList) {
  alert("No encontré el contenedor de archivos en index.html");
  return;
}

  if (selectedFiles.length === 0) {
    fileList.innerHTML = "Todavía no hay archivos cargados.";
    return;
  }

  fileList.innerHTML = selectedFiles.map(file => `
    <div class="fileItem">
      <strong>${file.name}</strong><br>
      ${(file.size / 1024 / 1024).toFixed(2)} MB
    </div>
  `).join("");

  processBtn.innerText = `Procesar ${selectedFiles.length} archivo(s)`;
}

processBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    alert("Selecciona imágenes primero");
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

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}
