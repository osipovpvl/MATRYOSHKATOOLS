// Функция для получения цвета по значению Trust
function getTrustColor(trust) {
  if (trust >= 0 && trust <= 30) return "red";
  if (trust >= 31 && trust <= 50) return "yellow";
  if (trust >= 51 && trust <= 100) return "green";
  return "black";
}

// Функция для получения цвета по значению Spam
function getSpamColor(spam) {
  if (spam >= 0 && spam <= 7) return "green";
  if (spam > 7 && spam <= 12) return "yellow";
  if (spam > 12 && spam <= 100) return "red";
  return "black";
}

// Функция для проверки домена через API
async function fetchDomainData(domain) {
  const apiKey = "c32b4abd558dbff2397e17546a77bc65";
  const apiUrl = `https://checktrust.ru/app.php?r=host/app/summary/basic&applicationKey=${apiKey}&host=${domain}&parameterList=trust,spam`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.summary) {
      return {
        trust: parseFloat(data.summary.trust),
        spam: parseFloat(data.summary.spam),
      };
    } else {
      console.error("Ошибка: Неверный формат ответа API:", data);
      return null;
    }
  } catch (error) {
    console.error("Ошибка при обращении к API:", error);
    return null;
  }
}

// Функция для обновления информации о доменах
async function updateSiteInfo() {
  const observer = new MutationObserver(() => {
    const siteLinks = document.querySelectorAll("span.site-link a");

    siteLinks.forEach(async (link) => {
      const domain = new URL(link.href).hostname;

      // Проверяем, есть ли уже добавленный Trust/Spam, чтобы не дублировать
      if (link.nextElementSibling && link.nextElementSibling.classList.contains("trust-spam-info")) {
        return;
      }

      // Создаем контейнер для Trust/Spam
      const infoSpan = document.createElement("span");
      infoSpan.classList.add("trust-spam-info");
      infoSpan.style.marginLeft = "10px";
      infoSpan.textContent = "Проверка...";

      link.parentElement.appendChild(infoSpan);

      // Получаем данные через API
      const data = await fetchDomainData(domain);
      if (data) {
        const trustColor = getTrustColor(data.trust);
        const spamColor = getSpamColor(data.spam);

        infoSpan.innerHTML = `
          <b>Trust:</b> <span style="color: ${trustColor};">${data.trust}</span>,
          <b>Spam:</b> <span style="color: ${spamColor};">${data.spam}</span>
        `;
      } else {
        infoSpan.textContent = "Ошибка API";
        infoSpan.style.color = "red";
      }
    });
  });

  // Наблюдаем за изменениями в DOM
  observer.observe(document.body, { childList: true, subtree: true });

  // Обновляем информацию для уже существующих элементов
  const initialLinks = document.querySelectorAll("span.site-link a");
  initialLinks.forEach((link) => {
    const event = new Event("DOMNodeInserted");
    link.dispatchEvent(event);
  });
}

// Запускаем скрипт после загрузки страницы
window.addEventListener("load", () => {
  console.log("Content script loaded.");
  updateSiteInfo();
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "collectLinks") {
    const links = Array.from(document.querySelectorAll("a")).map(link => {
      const href = link.getAttribute("href") || "";
      const protocol = href.split(":")[0];
      const rel = link.getAttribute("rel") || ""; // Считываем атрибут rel
      const text = link.innerText.trim() || link.querySelector("img")?.alt || "Без текста"; // Текст ссылки
      const visible = link.offsetParent !== null && getComputedStyle(link).display !== "none"; // Проверка видимости

      return {
        href: href,
        protocol: protocol,
        rel: rel.toLowerCase(), // Приводим rel к нижнему регистру
        text: text,
        visible: visible,
      };
    });

    sendResponse({ links });
  }
});


function getImagesData() {
  const images = Array.from(document.images);

  return images.map(img => ({
    src: img.src,
    alt: img.getAttribute("alt"),
    hasAlt: img.hasAttribute("alt"),
  }));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getImages") {
    const imagesData = getImagesData();
    sendResponse({ images: imagesData });
  }
});

