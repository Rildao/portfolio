// Todo link pra fora do site abre em aba nova, pra pessoa não sair do portfólio.
document.querySelectorAll('a[href^="http"]').forEach((a) => {
  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener";
  }
});

// Vídeos do YouTube: mostra só a thumbnail e carrega o player quando a pessoa clica.
document.querySelectorAll(".video").forEach((box) => {
  const id = box.dataset.yt;
  const title = box.closest(".polaroid")?.querySelector(".polaroid__caption")?.textContent.trim() || "video";

  if (!id) {
    box.innerHTML = '<span class="video__soon">Coming soon</span>';
    return;
  }

  const btn = document.createElement("button");
  btn.className = "video__play";
  btn.type = "button";
  btn.setAttribute("aria-label", `Play: ${title}`);

  const thumb = new Image();
  thumb.alt = "";
  thumb.loading = "lazy";
  thumb.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  // quando o vídeo não tem thumbnail em alta, o YouTube devolve uma imagem cinza de 120px
  thumb.addEventListener("load", () => {
    if (thumb.naturalWidth <= 120) thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  });
  btn.append(thumb);

  btn.addEventListener("click", () => {
    // shorts abrem ampliados por cima da página (o player vertical do YouTube não tem tela cheia)
    if (box.classList.contains("video--tall")) {
      openLightbox(id, title, btn);
    } else {
      box.replaceChildren(makePlayer(id, title));
    }
  });

  box.append(btn);
});

function makePlayer(id, title) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  iframe.title = title;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
}

// Lightbox dos shorts
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.hidden = true;
lightbox.innerHTML = `
  <button class="lightbox__close" type="button" aria-label="Close video"></button>
  <figure class="lightbox__card">
    <div class="lightbox__video"></div>
    <figcaption class="polaroid__caption lightbox__caption"></figcaption>
  </figure>`;
document.body.append(lightbox);

const lbVideo = lightbox.querySelector(".lightbox__video");
const lbCaption = lightbox.querySelector(".lightbox__caption");
const lbClose = lightbox.querySelector(".lightbox__close");
let lastTrigger = null;

function openLightbox(id, title, trigger) {
  lastTrigger = trigger;
  lbVideo.replaceChildren(makePlayer(id, title));
  lbCaption.textContent = title;
  lightbox.setAttribute("aria-label", title);
  lightbox.hidden = false;
  document.documentElement.classList.add("no-scroll");
  requestAnimationFrame(() => lightbox.classList.add("is-open"));
  lbClose.focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.classList.remove("is-open");
  document.documentElement.classList.remove("no-scroll");
  setTimeout(() => {
    lightbox.hidden = true;
    lbVideo.replaceChildren();          // tira o player pra parar o som
  }, 250);
  lastTrigger?.focus();
}

lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();   // clique fora do card
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// Discord e e-mail: copiam o texto ao clicar.
const toast = document.querySelector(".toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.querySelectorAll("[data-copy]").forEach((el) => {
  el.addEventListener("click", async () => {
    const text = el.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      showToast(el.dataset.toast);
    } catch {
      showToast(text);
    }
  });
});
