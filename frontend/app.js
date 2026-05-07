const dropzone = document.getElementById("dropzone");
const processBtn = document.getElementById("processBtn");

let selectedFiles = [];

dropzone.addEventListener("change", (e) => {
  selectedFiles = Array.from(e.target.files);

  if (selectedFiles.length > 0) {
    processBtn.innerText = `Procesar ${selectedFiles.length} archivo(s)`;
  }
});

processBtn.addEventListener("click", async () => {

  if (selectedFiles.length === 0) {
    alert("Selecciona imágenes primero");
    return;
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF();

  for (let i = 0; i < selectedFiles.length; i++) {

    const file = selectedFiles[i];

    const imageData = await readFile(file);

    const img = new Image();

    img.src = imageData;

    await new Promise(resolve => {
      img.onload = resolve;
    });

    const width = pdf.internal.pageSize.getWidth();
    const height = (img.height * width) / img.width;

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(imageData, "JPEG", 0, 0, width, height);
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
