const API_URL = localStorage.getItem("FACILPDF_API") || "http://localhost:8000";
let selectedMode = "merge_all";
let uploadedFiles = [];
let subscribedEmail = localStorage.getItem("facilpdf_email") || "";

const dict = {
  es:{tools:"Herramientas",pricing:"Gratis / Premium",badge:"PDF online gratis",title:"Convierte, une y comprime documentos en segundos",subtitle:"Funciona en PC, tablet, Android y iPhone. Ideal para páginas que piden archivos de máximo 1 MB.",uploadTitle:"Selecciona tus archivos",uploadText:"JPG, PNG o PDF · Máximo recomendado 50 MB por archivo",loaded:"Archivos cargados",clear:"Limpiar todo",empty:"Todavía no hay archivos cargados.",jpgPdf:"JPG a PDF",mergePdf:"Unir PDFs",mergeAll:"Unir PDF + JPG",compress:"Comprimir a 1 MB",process:"Procesar archivos",subscribeTitle:"Únete gratis a FácilPDF",subscribeText:"Suscríbete gratis para usar las herramientas.",subscribeBtn:"Suscribirme gratis",b1:"Acceso a todas las herramientas",b2:"Plan gratuito y opción premium",b3:"Archivos procesados con seguridad",plans:"Planes",premiumText:"Más peso, OCR y sin anuncios"},
  it:{tools:"Strumenti",pricing:"Gratis / Premium",badge:"PDF online gratis",title:"Converti, unisci e comprimi documenti in pochi secondi",subtitle:"Funziona su PC, tablet, Android e iPhone. Ideale per siti che chiedono file massimo 1 MB.",uploadTitle:"Seleziona i tuoi file",uploadText:"JPG, PNG o PDF · Massimo consigliato 50 MB per file",loaded:"File caricati",clear:"Cancella tutto",empty:"Non hai ancora caricato file.",jpgPdf:"JPG in PDF",mergePdf:"Unisci PDF",mergeAll:"Unisci PDF + JPG",compress:"Comprimi a 1 MB",process:"Elabora file",subscribeTitle:"Iscriviti gratis a FácilPDF",subscribeText:"Iscriviti gratis per usare gli strumenti.",subscribeBtn:"Iscrivimi gratis",b1:"Accesso a tutti gli strumenti",b2:"Piano gratuito e opzione premium",b3:"File elaborati in sicurezza",plans:"Piani",premiumText:"Più peso, OCR e senza annunci"},
  en:{tools:"Tools",pricing:"Free / Premium",badge:"Free online PDF",title:"Convert, merge and compress documents in seconds",subtitle:"Works on PC, tablet, Android and iPhone. Perfect for sites requiring files under 1 MB.",uploadTitle:"Select your files",uploadText:"JPG, PNG or PDF · Recommended max 50 MB per file",loaded:"Uploaded files",clear:"Clear all",empty:"No files uploaded yet.",jpgPdf:"JPG to PDF",mergePdf:"Merge PDFs",mergeAll:"Merge PDF + JPG",compress:"Compress to 1 MB",process:"Process files",subscribeTitle:"Join FácilPDF for free",subscribeText:"Subscribe free to use the tools.",subscribeBtn:"Subscribe free",b1:"Access to every tool",b2:"Free plan and premium option",b3:"Files processed securely",plans:"Plans",premiumText:"More size, OCR and no ads"},
  pt:{tools:"Ferramentas",pricing:"Grátis / Premium",badge:"PDF online grátis",title:"Converta, junte e comprima documentos em segundos",subtitle:"Funciona em PC, tablet, Android e iPhone. Ideal para sites que pedem arquivos de até 1 MB.",uploadTitle:"Selecione seus arquivos",uploadText:"JPG, PNG ou PDF · Máximo recomendado 50 MB por arquivo",loaded:"Arquivos carregados",clear:"Limpar tudo",empty:"Ainda não há arquivos carregados.",jpgPdf:"JPG para PDF",mergePdf:"Juntar PDFs",mergeAll:"Juntar PDF + JPG",compress:"Comprimir a 1 MB",process:"Processar arquivos",subscribeTitle:"Entre grátis no FácilPDF",subscribeText:"Assine grátis para usar as ferramentas.",subscribeBtn:"Assinar grátis",b1:"Acesso a todas as ferramentas",b2:"Plano gratuito e opção premium",b3:"Arquivos processados com segurança",plans:"Planos",premiumText:"Mais tamanho, OCR e sem anúncios"}
};

function applyLang(lang){
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=dict[lang][el.dataset.i18n]||el.textContent});
}

document.getElementById("lang").addEventListener("change", e=>applyLang(e.target.value));
applyLang("es");

function renderFiles(){
  const list=document.getElementById("fileList");
  list.innerHTML="";
  if(!uploadedFiles.length){list.innerHTML=`<p class="muted">${dict[document.getElementById("lang").value].empty}</p>`;return;}
  uploadedFiles.forEach((file,i)=>{
    const item=document.createElement("div"); item.className="fileItem";
    const thumb=document.createElement(file.type.startsWith("image/")?"img":"div"); thumb.className="thumb";
    if(file.type.startsWith("image/")) thumb.src=URL.createObjectURL(file); else thumb.textContent="PDF";
    item.innerHTML=`<div></div><div><strong>${file.name}</strong><br><small>${(file.size/1024/1024).toFixed(2)} MB</small></div><span class="tag">${file.name.split('.').pop().toUpperCase()}</span><button class="delete">🗑️</button>`;
    item.children[0].replaceWith(thumb);
    item.querySelector(".delete").onclick=()=>{uploadedFiles.splice(i,1);renderFiles();};
    list.appendChild(item);
  });
}

document.getElementById("files").addEventListener("change", e=>{uploadedFiles=[...uploadedFiles,...Array.from(e.target.files)];renderFiles();});
document.getElementById("clearBtn").onclick=()=>{uploadedFiles=[];renderFiles();};
document.querySelectorAll(".toolBtn").forEach(btn=>{btn.onclick=()=>{document.querySelectorAll(".toolBtn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");selectedMode=btn.dataset.mode;};});
document.querySelector('[data-mode="merge_all"]').classList.add("active");

document.getElementById("subscribeBtn").onclick=async()=>{
  const email=document.getElementById("email").value.trim();
  const result=document.getElementById("result");
  if(!email.includes("@")){result.textContent="Email inválido";return;}
  const form=new FormData(); form.append("email",email);
  try{await fetch(`${API_URL}/subscribe`,{method:"POST",body:form}); subscribedEmail=email; localStorage.setItem("facilpdf_email",email); result.textContent="✅ Suscripción activada gratis";}catch(e){result.textContent="No se pudo conectar al backend. Revisa API_URL.";}
};

document.getElementById("processBtn").onclick=async()=>{
  const result=document.getElementById("result");
  const email=document.getElementById("email").value.trim() || subscribedEmail;
  if(!email.includes("@")){result.textContent="Primero escribe tu email y suscríbete gratis.";return;}
  if(!uploadedFiles.length){result.textContent="Sube al menos un archivo.";return;}
  const form=new FormData(); form.append("email",email); form.append("mode",selectedMode); uploadedFiles.forEach(f=>form.append("files",f));
  result.textContent="Procesando...";
  try{
    const res=await fetch(`${API_URL}/process`,{method:"POST",body:form});
    const data=await res.json();
    if(!res.ok) throw new Error(data.detail||"Error");
    const link=`${API_URL}${data.download_url}`;
    result.innerHTML=`✅ Listo. Peso final: ${data.size_mb} MB<br><a href="${link}" target="_blank">Descargar PDF</a><br><small>${data.note||""}</small>`;
  }catch(e){result.textContent="Error: "+e.message;}
};
renderFiles();
