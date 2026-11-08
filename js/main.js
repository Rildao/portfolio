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
  if (box.dataset.cover) {
    // capa própria do portfólio (data-cover); sem ela, usa a thumbnail do YouTube
    thumb.src = box.dataset.cover;
  } else {
    thumb.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    // quando o vídeo não tem thumbnail em alta, o YouTube devolve uma imagem cinza de 120px
    thumb.addEventListener("load", () => {
      if (thumb.naturalWidth <= 120) thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    });
  }
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

// Fotos com caixa de seleção: arrastar as alças estica a foto (tipo Free Transform do Photoshop).
// Clique duplo em qualquer alça volta ao normal.
const EDGES = {                 // quais lados cada alça mexe: [esquerda, cima, direita, baixo]
  tl: [1, 1, 0, 0], tc: [0, 1, 0, 0], tr: [0, 1, 1, 0],
  ml: [1, 0, 0, 0],                   mr: [0, 0, 1, 0],
  bl: [1, 0, 0, 1], bc: [0, 0, 0, 1], br: [0, 0, 1, 1],
};
const MIN_SIZE = 40;

// só em aparelho com mouse; no celular as alças ficam só de enfeite (lá ia mais atrapalhar)
const canStretch = matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canStretch) document.querySelectorAll(".selection__box").forEach((box) => {
  const img = box.querySelector("img");
  const inset = { l: 0, t: 0, r: 0, b: 0 };
  let lastTap = 0;
  let hinted = false;
  let hint = null;

  // na primeira vez que a pessoa estica a foto, um balão na alça de cima à esquerda explica como voltar
  function showHint() {
    hint = document.createElement("span");
    hint.className = "tip";
    hint.textContent = "Double-click to reset";
    box.querySelector(".h--tl").append(hint);
    requestAnimationFrame(() => requestAnimationFrame(() => hint?.classList.add("is-visible")));
  }

  function hideHint() {
    if (!hint) return;
    const el = hint;
    hint = null;
    el.classList.remove("is-visible");
    setTimeout(() => el.remove(), 200);
  }

  // trava a foto em % da camada, pra ela distorcer junto quando a camada mudar de tamanho
  function pinImage() {
    if (img.classList.contains("is-pinned")) return;
    const w = box.clientWidth, h = box.clientHeight;
    const b = box.getBoundingClientRect(), i = img.getBoundingClientRect();
    const x = i.left - b.left - box.clientLeft, y = i.top - b.top - box.clientTop;
    Object.assign(img.style, {
      left: `${(x / w) * 100}%`, top: `${(y / h) * 100}%`,
      width: `${(i.width / w) * 100}%`, height: `${(i.height / h) * 100}%`,
    });
    img.classList.add("is-pinned");
  }

  function apply() {
    box.style.inset = `${inset.t}px ${inset.r}px ${inset.b}px ${inset.l}px`;
  }

  function reset() {
    hideHint();
    box.classList.add("is-resetting");
    Object.assign(inset, { l: 0, t: 0, r: 0, b: 0 });
    apply();
    setTimeout(() => box.classList.remove("is-resetting"), 450);
  }

  box.querySelectorAll(".h").forEach((handle) => {
    const [L, T, R, B] = EDGES[handle.dataset.h];

    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      // dois toques rápidos = volta ao normal (funciona no mouse e no celular)
      if (e.timeStamp - lastTap < 320) { lastTap = 0; reset(); return; }
      lastTap = e.timeStamp;

      pinImage();
      box.classList.remove("is-resetting");
      handle.setPointerCapture(e.pointerId);
      document.documentElement.classList.add("is-dragging");

      const start = { x: e.clientX, y: e.clientY, ...inset };
      const fig = box.parentElement;
      const W = fig.clientWidth, H = fig.clientHeight;

      // a camada não passa do papel visível da seção (depois do rasgo a foto some e a alça fica inalcançável)
      const f = fig.getBoundingClientRect();
      const s = fig.closest(".paper").getBoundingClientRect();
      const tear = innerWidth * 0.065, side = 12;    // ≈ altura dos PNGs de rasgo
      const topGap = fig.closest(".hero") ? side : tear;
      const max = {   // quanto cada lado pode crescer pra fora (inset negativo); nunca encolhe o tamanho original
        l: Math.min(0, s.left + side - f.left), r: Math.min(0, f.right - (s.right - side)),
        t: Math.min(0, s.top + topGap - f.top), b: Math.min(0, f.bottom - (s.bottom - tear)),
      };

      const move = (ev) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        hideHint();   // voltou a mexer: o balão some de vez
        if (L) inset.l = Math.max(max.l, Math.min(start.l + dx, W - start.r - MIN_SIZE));
        if (R) inset.r = Math.max(max.r, Math.min(start.r - dx, W - start.l - MIN_SIZE));
        if (T) inset.t = Math.max(max.t, Math.min(start.t + dy, H - start.b - MIN_SIZE));
        if (B) inset.b = Math.max(max.b, Math.min(start.b - dy, H - start.t - MIN_SIZE));
        apply();
      };
      const up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
        document.documentElement.classList.remove("is-dragging");
        const stretched = inset.l || inset.t || inset.r || inset.b;
        if (stretched && !hinted) { hinted = true; showHint(); }
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
  });
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
