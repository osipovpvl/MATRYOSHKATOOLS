// Функция для получения цвета по значению Trust
function getTrustColor(trust) {
  if (trust >= 0 && trust <= 30) return "red";
  if (trust >= 31 && trust <= 50) return "orange";
  if (trust >= 51 && trust <= 100) return "green";
  return "black";
}

// Функция для получения цвета по значению Spam
function getSpamColor(spam) {
  if (spam >= 0 && spam <= 7) return "green";
  if (spam > 7 && spam <= 12) return "orange";
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
      throw new Error(`Не удалось проверить: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.summary) {
      return {
        trust: parseFloat(data.summary.trust),
        spam: parseFloat(data.summary.spam),
      };
    } 
  } catch (error) {
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
          ТРАСТ: <span style="color: ${trustColor};">${data.trust}</span>,
          СПАМ: <span style="color: ${spamColor};">${data.spam}</span>
        `;
      } else {
        infoSpan.textContent = "Не удалось проверить";
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
  updateSiteInfo();
});

function getMetricsData() {
  const metrics = {
    yandexMetrika: new Set(),
    googleTagManager: new Set(),
    googleAnalytics: new Set(),
  };

  // Проверяем все скрипты на странице
  const scripts = Array.from(document.scripts);
  scripts.forEach(script => {
    const src = script.src || "";
    const innerContent = script.innerHTML || "";

    // Яндекс Метрика
    if (src.includes("mc.yandex.ru/metrika") || innerContent.includes("ym(")) {
      const matchSrc = src.match(/watch\/(\d+)/); // ID в src
      const matchYM = innerContent.match(/ym\((\d+),/); // ID в ym()
      if (matchSrc) metrics.yandexMetrika.add(matchSrc[1]);
      if (matchYM) metrics.yandexMetrika.add(matchYM[1]);

      // Поиск window.mainMetrikaId
      const mainMetrikaMatch = innerContent.match(/window\.mainMetrikaId\s*=\s*['"](\d+)['"]/);
      if (mainMetrikaMatch) metrics.yandexMetrika.add(mainMetrikaMatch[1]);
    }

    // Google Tag Manager
    if (src.includes("googletagmanager.com/gtm.js")) {
      const match = src.match(/id=GTM-[A-Z0-9]+/);
      if (match) metrics.googleTagManager.add(match[0].split("=")[1]);
    }

    // Google Analytics
    if (src.includes("google-analytics.com/analytics.js") || src.includes("gtag/js") || innerContent.includes("ga(")) {
      const match = src.match(/UA-\d+-\d+/) || src.match(/G-[A-Z0-9]+/) || innerContent.match(/['"]UA-\d+-\d+['"]/);
      if (match) metrics.googleAnalytics.add(match[0].replace(/['"]/g, ""));
    }
  });

  // Проверка переменной window.mainMetrikaId
  if (window.mainMetrikaId) {
    metrics.yandexMetrika.add(window.mainMetrikaId);
  }

  return {
    yandexMetrika: Array.from(metrics.yandexMetrika),
    googleTagManager: Array.from(metrics.googleTagManager),
    googleAnalytics: Array.from(metrics.googleAnalytics),
  };
}

// Функция для отслеживания динамических изменений
function observeDOM() {
  const observer = new MutationObserver(() => {
    const metricsData = getMetricsData();
    chrome.runtime.sendMessage({ action: "updateMetrics", metrics: metricsData });
  });

  observer.observe(document, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getMetrics") {
    const metricsData = getMetricsData();
    sendResponse(metricsData);
    observeDOM(); // Начинаем отслеживать изменения DOM
  }
});


function getImagesData() {
  const images = Array.from(document.images);

  return images.map(img => {
    const src = img.src || "";
    const format = src.split('.').pop().split('?')[0].toUpperCase(); // Извлекаем формат изображения
    let sizeInBytes = 0;

    // Получаем вес изображения
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("HEAD", src, false); // Синхронный запрос
      xhr.send(null);

      if (xhr.status === 200) {
        sizeInBytes = parseInt(xhr.getResponseHeader("Content-Length"), 10) || 0;
      }
    } catch (error) {
      //console.warn(`Не удалось получить вес изображения: ${src}`, error);
    }

    return {
      src: src,
      alt: img.getAttribute("alt"),
      title: img.title,
      hasAlt: img.hasAttribute("alt"),
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: format || "Неизвестно",
      sizeInKB: (sizeInBytes / 1024).toFixed(2) // Вес в КБ
    };
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getImages") {
    const imagesData = getImagesData();
    sendResponse({ images: imagesData });
  }
});