/*
 * Авторские права 2025 PAVEL OSIPOV «MATRYOSHKA TOOLS»
 *
 * Лицензировано по Лицензии Apache, версия 2.0 (далее «Лицензия»);
 * вы не можете использовать этот файл, за исключением случаев, предусмотренных Лицензией.
 * Вы можете получить копию Лицензии по адресу
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Если не требуется законом или по договоренности, программное обеспечение
 * распространяется по Лицензии «КАК ЕСТЬ», БЕЗ ГАРАНТИЙ И УСЛОВИЙ ЛЮБОГО ВИДА, явных или подразумеваемых.
 * Смотрите Лицензию для конкретного языка, регулирующего разрешения и
 * ограничения, предусмотренные Лицензией.
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


// Функция для подсветки элементов на странице
function applyHighlight(type, isEnabled) {
  if (type === "noindex") {
    const noIndexElements = document.querySelectorAll('noindex');
    noIndexElements.forEach((el) => {
      const firstContainer = el.querySelector('div, section, article, main, nav');
      if (firstContainer) {
        if (isEnabled) {
          firstContainer.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
          firstContainer.style.border = "2px solid black";
        } else {
          firstContainer.style.backgroundColor = "";
          firstContainer.style.border = "";
        }
      }
    });
  } else if (type === "nofollow") {
    const noFollowElements = document.querySelectorAll('a[rel="nofollow"]');
    noFollowElements.forEach((el) => {
      if (isEnabled) {
        el.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
        el.style.border = "2px solid black";
      } else {
        el.style.backgroundColor = "";
        el.style.border = "";
      }
    });
  }
}
// Загружаем сохраненные настройки и применяем подсветку
chrome.storage.local.get(['noIndexActive', 'noFollowActive'], function (result) {
  const noIndexActive = result.noIndexActive || false;
  const noFollowActive = result.noFollowActive || false;
  // Применяем подсветку на основе сохраненных значений
  applyHighlight("noindex", noIndexActive);
  applyHighlight("nofollow", noFollowActive);
});
// Слушаем изменения состояния и динамически применяем подсветку
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateHighlight") {
    applyHighlight(message.highlightType, message.isEnabled);
  }
});

let highlightedElements = []; // Список подсвеченных элементов
let displayNoneObserver = null; // Наблюдатель за изменениями DOM

// Функция подсветки и показа элементов
function toggleDisplayNoneElements(show) {
  // Сбрасываем подсветку предыдущих элементов
  highlightedElements.forEach((el) => {
    el.style.outline = '';
    el.style.backgroundColor = '';
    el.style.display = 'none'; // Возвращаем исходное состояние
  });
  highlightedElements = [];

  if (show) {
    // Находим все элементы с display: none
    const elements = Array.from(document.querySelectorAll('*')).filter((el) => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.display === 'none';
    });

    // Подсвечиваем и показываем элементы
    elements.forEach((el) => {
      el.style.display = ''; // Показываем элемент
      el.style.outline = '2px solid black';
      el.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      highlightedElements.push(el);
    });
  }
}

// Настройка наблюдателя для отслеживания изменений в DOM
function startDisplayNoneObserver() {
  if (displayNoneObserver) displayNoneObserver.disconnect(); // Отключаем предыдущий наблюдатель

  displayNoneObserver = new MutationObserver(() => {
    chrome.storage.local.get(['toggleDisplayNone'], (result) => {
      const isOn = result.toggleDisplayNone || false;
      if (isOn) {
        toggleDisplayNoneElements(true); // Повторно применяем подсветку
      }
    });
  });

  displayNoneObserver.observe(document.body, {
    childList: true, // Следим за добавлением/удалением узлов
    subtree: true,   // Следим за всеми уровнями вложенности
  });
}

// Проверяем сохраненное состояние при загрузке страницы
chrome.storage.local.get(['toggleDisplayNone'], (result) => {
  const isOn = result.toggleDisplayNone !== undefined ? result.toggleDisplayNone : false;

  // Применяем начальное состояние подсветки
  toggleDisplayNoneElements(isOn);

  // Запускаем наблюдатель за изменениями DOM
  startDisplayNoneObserver();
});

// Слушаем изменения состояния от popup.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.toggle !== undefined) {
    toggleDisplayNoneElements(message.toggle);

    // Сохраняем новое состояние
    chrome.storage.local.set({ toggleDisplayNone: message.toggle });

    // Перезапускаем наблюдатель за изменениями DOM
    if (message.toggle) {
      startDisplayNoneObserver();
    } else if (displayNoneObserver) {
      displayNoneObserver.disconnect(); // Останавливаем наблюдатель
    }
  }
});




// Изначально функции отключены
let functionsEnabled = false;

// Наблюдатель для отслеживания изменений DOM
let observer = null;

// Функция для включения/выключения функций
function toggleFunctions(enable) {
  functionsEnabled = enable;

  if (functionsEnabled) {
    updateSiteInfo(); // Запускаем обновление информации
    observeDOMChanges(); // Запускаем наблюдатель за изменениями DOM
  } else {
    stopUpdatingSiteInfo(); // Очищаем информацию
    disconnectObserver(); // Останавливаем наблюдатель
  }
}

// Функция для получения API ключа из chrome.storage
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

// Функция для определения цвета Trust
function getTrustColor(trust) {
  if (trust >= 0 && trust <= 30) return "red";
  if (trust >= 31 && trust <= 50) return "orange";
  if (trust >= 51 && trust <= 100) return "green";
  return "black";
}

// Функция для определения цвета Spam
function getSpamColor(spam) {
  if (spam >= 0 && spam <= 7) return "green";
  if (spam > 7 && spam <= 12) return "orange";
  if (spam > 12 && spam <= 100) return "red";
  return "black";
}

// Функция для получения данных домена через API
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
    //console.error(`Ошибка при получении данных для домена ${domain}:`, error);
    return null;
  }
}

// Функция для обновления информации о доменах
async function updateSiteInfo() {
  if (!functionsEnabled) return; // Проверяем, активны ли функции

  //console.log("Обновление информации о доменах...");
  const siteLinks = document.querySelectorAll("span.site-link a");

  siteLinks.forEach(async (link) => {
    const domain = new URL(link.href).hostname;

    // Проверяем, добавлена ли информация Trust/Spam
    if (link.nextElementSibling && link.nextElementSibling.classList.contains("trust-spam-info")) {
      return;
    }

    // Создаем элемент для отображения информации
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

// Функция для остановки обновления информации
function stopUpdatingSiteInfo() {
  //console.log("Остановка обновления информации...");
  const allInfoSpans = document.querySelectorAll(".trust-spam-info");
  allInfoSpans.forEach((span) => span.remove());
}

// Функция для наблюдения за изменениями DOM
function observeDOMChanges() {
  if (observer) observer.disconnect(); // Отключаем старый наблюдатель, если он существует

  observer = new MutationObserver(() => {
    if (functionsEnabled) {
      updateSiteInfo(); // Обновляем информацию при изменении DOM
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Отключение наблюдателя
function disconnectObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Загружаем сохраненное состояние функций при загрузке страницы
window.addEventListener("load", () => {
  chrome.storage.sync.get('functionsEnabled', (data) => {
    functionsEnabled = data.functionsEnabled || false;

    // Включаем или отключаем функции в зависимости от сохраненного состояния
    toggleFunctions(functionsEnabled);
  });
});

// Обработчик сообщений от popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enable') {
    toggleFunctions(true);
  } else if (request.action === 'disable') {
    toggleFunctions(false);
  }
});

chrome.storage.local.get('showNumbers', (data) => {
  if (data.showNumbers) {
      observeSearchResults();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.showNumbers) {
      if (changes.showNumbers.newValue) {
          observeSearchResults();
      } else {
          clearNumbering();
      }
  }
});
// Переменная для отслеживания состояния нумерации
let isNumberingActive = false;

// Функция для включения/отключения нумерации
function toggleNumbering(isEnabled) {
  isNumberingActive = isEnabled;

  if (isNumberingActive) {
    // Включаем нумерацию
    observeSearchResults();
  } else {
    // Отключаем нумерацию
    clearNumbering();
  }
}

// Наблюдение за изменениями в поисковой выдаче
function observeSearchResults() {
  const observer = new MutationObserver(() => {
      if (window.location.hostname.includes('google')) {
          numberGoogleResults();
      } else if (window.location.hostname.includes('yandex')) {
          numberYandexResults();
      }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Получение текущей страницы поиска
function getCurrentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.hostname.includes('google')) {
      const start = parseInt(urlParams.get('start')) || 0; // Google: параметр `start`
      return Math.floor(start / 10) + 1; // Нумерация страниц с 1
  } else if (window.location.hostname.includes('yandex')) {
      const p = parseInt(urlParams.get('p')) || 0; // Яндекс: параметр `p`
      return p + 1; // Нумерация страниц с 1
  }
}

// Нумерация для Google
function numberGoogleResults() {
  const page = getCurrentPage();
  let startNumber = (page - 1) * 10;

  const results = document.querySelectorAll('[data-heading-tag="H3"]:not([data-numbered])');

  results.forEach((result, index) => {
      const currentNumber = startNumber + index + 1;

      const color = getColorForPosition(currentNumber);

      const num = document.createElement('div');
      num.textContent = `${currentNumber}`;
      num.style.fontWeight = 'bold';
      num.style.fontSize = '14px';
      num.style.color = color;
      num.style.marginRight = '8px';

      result.style.display = 'flex';
      result.style.alignItems = 'center';
      result.prepend(num);

      result.setAttribute('data-numbered', 'true');
  });
}
// Нумерация для Яндекса
function numberYandexResults() {
  const page = getCurrentPage();
  let startNumber = (page - 1) * 10;

  const results = document.querySelectorAll(
      'h2.OrganicTitle-LinkText.organic__url-text[data-heading-tag="H2"]:not([data-numbered])'
  );

  results.forEach((h2) => {
      const result = h2.closest('.serp-item');

      // Проверка на наличие рекламы
      const isAdvertisement = result.querySelector('span') && 
          Array.from(result.querySelectorAll('span')).some(span => span.textContent.trim().toLowerCase() === 'реклама');

      if (isAdvertisement) {
          return; // Пропускаем этот элемент, если это реклама
      }

      if (
          !result || // Если родительский элемент отсутствует
          result.getAttribute('data-fast') === '2' || // Исключаем рекламу
          result.querySelector('.LabelDirect') // Исключаем рекламные блоки
      ) {
          return; // Пропускаем рекламные результаты
      }

      // Проверяем, добавлена ли нумерация
      if (result.hasAttribute('data-numbered')) return;

      startNumber++;

      const color = getColorForPosition(startNumber);

      const num = document.createElement('div');
      num.textContent = `${startNumber}`;
      num.style.fontWeight = 'bold';
      num.style.fontSize = '14px';
      num.style.color = color;
      num.style.marginRight = '8px';

      const parent = h2.parentElement;
      if (parent) {
          parent.style.display = 'flex';
          parent.style.alignItems = 'center';
          parent.prepend(num);
      }

      // Помечаем, что элемент уже нумерован
      result.setAttribute('data-numbered', 'true');
  });
}

// Получение цвета для позиции
function getColorForPosition(position) {
  switch (position) {
      case 1:
          return 'gold'; // Золотой для 1-го места
      case 2:
          return 'silver'; // Серебристый для 2-го места
      case 3:
          return '#cd7f32'; // Бронзовый для 3-го места
      default:
          return '#8bb4dd'; // Голубой (ссылочный цвет) для остальных
  }
}

// Очистка нумерации
function clearNumbering() {
  // Убираем все элементы с нумерацией
  document.querySelectorAll('[data-numbered]').forEach((element) => {
      // Удаляем числа (div) в результатах
      const numberElement = element.querySelector('div');
      if (numberElement && numberElement.textContent.match(/^\d+$/)) {
          numberElement.remove();
      }
      
      // Убираем атрибут, который помечает элемент как нумерованный
      element.removeAttribute('data-numbered');
  });
}








// Функция для скрытия рекламы на странице
function hideAds() {
  // Селекторы рекламных блоков
  const adSelectors = [
    '.serp-item__adv-label',          // Рекламная метка в Яндексе
    '.FldYtdxHIF',                    // Рекламные блоки в Яндексе
    '.Organic-ContentWrapper organic__content-wrapper', // Обертка для рекламы в Яндексе
    '.Organic organic Typo Typo_text_m Typo_line_s',     // Метка рекламы в Яндексе
    '[data-fast-advert]',             // Быстрые рекламные блоки в Яндексе
    '[data-fast*="2"]',               // Быстрые рекламные блоки с номерами в Яндексе
    '.serp-item[data-bem*="adv"]',    // Общие рекламные элементы в Яндексе
    '[aria-label="Реклама"]',         // Метка рекламы в Google
    '.ads-ad',                        // Рекламные блоки в Google
    '.tads',                          // Топовые рекламные блоки в Google
    '#tvcap',                         // Реклама на боковой панели в Google
    '.ad_cclk',                       // Клики по рекламе в Google
  ];

  // Проходим по всем селекторам и скрываем рекламные блоки
  adSelectors.forEach(selector => {
    const ads = document.querySelectorAll(selector);
    ads.forEach(ad => {
      const parent = ad.closest('.serp-item');
      if (parent) {
        parent.remove();  // Удаляем только родительский элемент рекламного блока
      }
    });
  });

  // Также ищем элементы <span> с текстом "реклама" и скрываем родительские блоки
  const spanAds = document.querySelectorAll('span');
  spanAds.forEach(span => {
    if (span.textContent.trim().toLowerCase() === 'реклама') {
      // Если текст в <span> "реклама", скрываем родительский элемент
      const parent = span.closest('.serp-item');
      if (parent) {
        parent.remove();  // Удаляем родительский блок, который содержит этот <span>
      }
    }
  });
}

// Функция для показа рекламы (в будущем, если потребуется восстановить отображение)
function showAds() {
  // Логика для показа рекламы может быть добавлена, если нужно вернуть элементы
  // Например, можно заново загружать или восстанавливать скрытые элементы
}

// Слушаем сообщения от popup.js для управления состоянием рекламы
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleHideAds') {
    if (message.enabled) {
      hideAds();  // Если включено скрытие, скрываем рекламу
    } else {
      showAds();  // Если выключено скрытие, показываем рекламу
    }
  }
});

// Проверяем состояние сразу при загрузке страницы
chrome.storage.sync.get('hideAdsEnabled', (data) => {
  const isEnabled = data.hideAdsEnabled || false;
  if (isEnabled) {
    hideAds();  // Если состояние включено, скрываем рекламу
  }
});
