/*
 * Copyright 2025 PAVEL OSIPOV (MATRYOSHKA TOOLS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

function getImageSize(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = function () {
      reject("Не удалось загрузить изображение");
    };
    img.src = url;
  });
}

function getImageSizeAndWeight(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      // Получаем размеры изображения
      const width = img.width;
      const height = img.height;

      // Получаем размер изображения (в байтах)
      const xhr = new XMLHttpRequest();
      xhr.open("HEAD", url, true); // асинхронный запрос
      xhr.onload = function () {
        const sizeInBytes = parseInt(xhr.getResponseHeader("Content-Length"), 10) || 0;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2); // Преобразуем в КБ
        resolve({ width, height, sizeInKB });
      };
      xhr.onerror = function () {
        reject("Не удалось получить размер изображения");
      };
      xhr.send();
    };
    img.onerror = function () {
      reject("Не удалось загрузить изображение");
    };
    img.src = url;
  });
}

function getImagesData() {
  const images = Array.from(document.images);

  // Извлекаем изображения, используемые в background-image в CSS
  const cssImages = [];
  const allElements = document.querySelectorAll('*'); // Все элементы на странице

  allElements.forEach(el => {
    const style = getComputedStyle(el);
    const backgroundImage = style.backgroundImage;

    // Если background-image не пустой и он содержит URL
    if (backgroundImage && backgroundImage !== 'none') {
      const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      if (match) {
        const url = match[1]; // Извлекаем URL изображения из CSS
        cssImages.push({
          src: url,
          isInCSS: true,
          alt: '', // Пустой alt, так как это не реальный тег <img>
          title: '',
          width: 0,
          height: 0,
          format: url.split('.').pop().toUpperCase(),
          sizeInKB: 0 // Здесь будет обновляться размер
        });
      }
    }
  });

  const allImages = images.map(img => {
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
      sizeInKB: (sizeInBytes / 1024).toFixed(2),
      isInCSS: false // Эти изображения не из CSS, а с тега <img>
    };
  });

  // Асинхронно получаем данные для изображений, используемых в background-image
  const cssImagesWithSizePromises = cssImages.map(image => {
    return getImageSizeAndWeight(image.src).then(sizeData => {
      image.width = sizeData.width;
      image.height = sizeData.height;
      image.sizeInKB = sizeData.sizeInKB;
      return image;
    }).catch(() => {
      image.width = 0;
      image.height = 0;
      image.sizeInKB = 0;
      return image;
    });
  });

  // Дожидаемся, пока все изображения будут обработаны
  return Promise.all(cssImagesWithSizePromises).then(updatedCssImages => {
    return [...allImages, ...updatedCssImages]; // Возвращаем объединенный список изображений
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getImages") {
    getImagesData().then(imagesData => {
      sendResponse({ images: imagesData });
    });
    return true; // Возвращаем true, чтобы обработать асинхронный ответ
  }
});


// Проверяем сохраненное состояние при загрузке страницы
chrome.storage.local.get(['cssEnabled'], function(result) {
  const cssEnabled = result.cssEnabled !== undefined ? result.cssEnabled : true; // Восстанавливаем состояние из памяти

  // Если стили выключены, сразу отключаем их
  if (!cssEnabled) {
    disableStyles();
  }
});

// Функция для отключения всех стилей
function disableStyles() {
  const links = document.querySelectorAll("link[rel='stylesheet']");
  links.forEach((link) => {
    link.disabled = true; // Отключаем все стили
  });
}

// Изначально функции отключены
let functionsEnabled = false;

// Функция для включения/выключения функций
function toggleFunctions(enable) {
  functionsEnabled = enable;

  if (functionsEnabled) {
    console.log("Functions enabled");
    updateSiteInfo(); // Включаем функциональность (если функции активированы)
  } else {
    console.log("Functions disabled");
    // Отключаем все функции (если функции деактивированы)
    stopUpdatingSiteInfo(); // Останавливаем обновление, если функции отключены
  }
}

// Функция для получения API ключа из storage
function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('apiKey', (data) => {
      if (data.apiKey) {
        resolve(data.apiKey);
      } else {
        reject('API ключ не найден');
      }
    });
  });
}

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
  try {
    const apiKey = await getApiKey(); // Получаем API ключ
    const apiUrl = `https://checktrust.ru/app.php?r=host/app/summary/basic&applicationKey=${apiKey}&host=${domain}&parameterList=trust,spam`;

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
    console.error("Ошибка при получении данных:", error);
    return null;
  }
}

// Функция для обновления информации о доменах
async function updateSiteInfo() {
  console.log("Обновление информации о сайте...");
  const siteLinks = document.querySelectorAll("span.site-link a");

  siteLinks.forEach(async (link) => {
    const domain = new URL(link.href).hostname;

    // Проверяем, есть ли уже добавленный Trust/Spam, чтобы не дублировать
    if (link.nextElementSibling && link.nextElementSibling.classList.contains("trust-spam-info")) {
      return;
    }

    // Если функции отключены, то ничего не добавляем
    if (!functionsEnabled) return;

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

      infoSpan.innerHTML = `ТРАСТ: <span style="color: ${trustColor};">${data.trust}</span>, СПАМ: <span style="color: ${spamColor};">${data.spam}</span>`;
    } else {
      infoSpan.textContent = "Не удалось проверить";
      infoSpan.style.color = "red";
    }
  });
}

// Останавливаем обновление информации, если функции отключены
function stopUpdatingSiteInfo() {
  console.log("Обновление информации остановлено.");
  // Очистка всех добавленных элементов (если они есть)
  const allInfoSpans = document.querySelectorAll(".trust-spam-info");
  allInfoSpans.forEach(span => span.remove());
}

// Запускаем скрипт после загрузки страницы, но только если функции активированы
window.addEventListener("load", () => {
  // Загружаем состояние из chrome.storage при перезагрузке страницы
  chrome.storage.sync.get('functionsEnabled', (data) => {
    functionsEnabled = data.functionsEnabled || false; // Получаем состояние

    if (functionsEnabled) {
      updateSiteInfo();
    }
  });
});

// Обработчик сообщений от popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'enable') {
    toggleFunctions(true);
  } else if (request.action === 'disable') {
    toggleFunctions(false);
  }
});
