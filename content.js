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



if (window.location.hostname === 'wordstat.yandex.ru') {
  //Панель Вордстат 
  function addSearchButtons() {
    chrome.storage.local.get(["wordstatPanel"], function (result) {
      const isEnabled = result.wordstatPanel !== false;
      const searchInputContainer = document.querySelector('.wordstat__search-input');
      if (!searchInputContainer) return;
  
      let panel = document.getElementById("wordstat-helper");
      if (!panel) {
        panel = document.createElement("div");
        panel.id = "wordstat-helper";
        searchInputContainer.appendChild(panel);
      }
      panel.style.display = isEnabled ? "block" : "none";
  
      if (!isEnabled || panel.childElementCount) return;
  
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'custom-wrapp-buttons';
      buttonsContainer.style.position = 'absolute';
      buttonsContainer.style.top = '0';
      buttonsContainer.style.bottom = '0';
      buttonsContainer.style.right = '0';
      buttonsContainer.style.zIndex = '3';
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.alignItems = 'center';
      buttonsContainer.style.gap = '2px';
      buttonsContainer.style.padding = '0 5px';
      buttonsContainer.style.margin = '80px 500px 0px 0px';
  
      function applyTransformation(type) {
        const searchInput = document.querySelector(".wordstat__search-input > input");
        if (!searchInput || !searchInput.value) return;
  
        let words = searchInput.value.trim().split(/\s+/);
  
        if (type === "group") {
          searchInput.value = words.length > 1 ? `(${words.join('|')})` : `(${words[0]})`;
        } else if (type === "minus") {
          searchInput.value = words.map(word => word.startsWith('-') ? word : `-${word}`).join(' ');
        } else if (type === "clear") {
          searchInput.value = searchInput.value
            .replace(/["\[\]()!\-]/g, '')
            .replace(/\|/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          const n = searchInput.value.replace(/-\[.*\]\s?/gi, "")
            .replace(/["\[\]']/gi, "")
            .trim(),
            r = n.split(" -"),
            a = r[0],
            o = r.slice(1),
            i = n.replace(/-[[\]"][^[\]"]*[[\]"]/gi, "")
              .split(" ")
              .map(e => e[0] === "-" ? "" : e)
              .join(" ")
              .trim(),
            l = `"${a} ${a.split(" ").slice(-1)[0]}"${o.length ? " -" + o.join(" -") : ""}`,
            s = `"${i}"`,
            u = `[${i}]`,
            c = `"${i.split(" ").map(e => "-!+".includes(e[0]) ? e : "!" + e).join(" ")}"`;
  
          if (type === "level") searchInput.value = l;
          else if (type === "exact") searchInput.value = s;
          else if (type === "form") searchInput.value = c;
          else if (type === "order") searchInput.value = u;
        }
  
        searchInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
        const searchButton = document.querySelector(".wordstat__search-button");
        if (searchButton) searchButton.click();
      }
  
      const buttons = [
        { title: 'Дублирование последнего слова', text: '++', type: 'level' },
        { title: 'Точное соответствие', text: '""', type: 'exact' },
        { title: 'Фиксация словоформ', text: '!!', type: 'form' },
        { title: 'Фиксированный порядок слов', text: '[]', type: 'order' },
        { title: 'Группировка слов', text: '()', type: 'group' },
        { title: 'Минусовать слова', text: '--', type: 'minus' },
        { title: 'Очистка спецсимволов', text: 'X', type: 'clear' }
      ];
  
      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'custom-wrapp-button';
        button.title = btn.title;
        button.textContent = btn.text;
        button.style.background = 'white';
        button.style.border = '1px solid #ddd';
        button.style.padding = '5px 8px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.borderRadius = '5px';
  
        button.addEventListener('click', () => applyTransformation(btn.type));
  
        buttonsContainer.appendChild(button);
      });
  
      panel.appendChild(buttonsContainer);
    });
  }
  
  const observer = new MutationObserver(() => addSearchButtons());
  observer.observe(document.body, { childList: true, subtree: true });
  
  window.onload = function () { addSearchButtons(); };
  
}



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
    liveInternet: new Set(),
  };

  // Проверяем все скрипты на странице
  const scripts = Array.from(document.scripts);
  scripts.forEach(script => {
    const src = script.src || "";
    const innerContent = script.innerHTML || "";

    // Яндекс Метрика (старый способ)
    if (src.includes("mc.yandex.ru/metrika") || innerContent.includes("ym(") || innerContent.includes("Ya.Metrika")) {
      const matchSrc = src.match(/watch\/(\d+)/);
      const matchYM = innerContent.match(/ym\((\d+),/);
      const matchMetrika = innerContent.match(/new Ya\.Metrika\(\{[^}]*id\s*:\s*(\d+)/);

      if (matchSrc) metrics.yandexMetrika.add(matchSrc[1]);
      if (matchYM) metrics.yandexMetrika.add(matchYM[1]);
      if (matchMetrika) metrics.yandexMetrika.add(matchMetrika[1]);

      const mainMetrikaMatch = innerContent.match(/window\.mainMetrikaId\s*=\s*['"](\d+)['"]/);
      if (mainMetrikaMatch) metrics.yandexMetrika.add(mainMetrikaMatch[1]);
    }

    // Новый счетчик Ya.Metrika2
    if (innerContent.includes('window.yandex = {};') && innerContent.includes('window.yandex.metrika = new Ya.Metrika2')) {
      const matchMetrika2 = innerContent.match(/'id'\s*:\s*(\d+)/);
      if (matchMetrika2) {
        const metrikaId = matchMetrika2[1];
        metrics.yandexMetrika.add(metrikaId);
      }
    }

    // Новый вариант объявления Ya.Metrika2 (если создаётся через объект)
    if (innerContent.includes("Ya.Metrika2") || innerContent.includes("window.yandex.metrika")) {
      const matchMetrika2 = innerContent.match(/id\s*:\s*(\d+)/);
      if (matchMetrika2) {
        metrics.yandexMetrika.add(matchMetrika2[1]);
      }
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

    // Проверка на наличие счетчика LiveInternet
    if (src.includes("counter.yadro.ru/hit")) {
      metrics.liveInternet.add("Найден счетчик в script src");
    }
    if (innerContent.includes("counter.yadro.ru/hit")) {
      metrics.liveInternet.add("Найден счетчик в содержимом script");
    }
    if (src.includes("counter.yadro.ru/logo") || innerContent.includes("liveinternet.ru/click")) {
      metrics.liveInternet.add("Найдено изображение или ссылка счетчика");
    }
    if (innerContent.includes("counter.yadro.ru/hit") && innerContent.includes("amp-analytics")) {
      metrics.liveInternet.add("Найден счетчик в AMP аналитике");
    }
  });

  // Проверяем динамически загруженные счетчики в window
  for (const key in window) {
    if (/yaCounter\d+/.test(key)) {
      const match = key.match(/yaCounter(\d+)/);
      if (match) {
        metrics.yandexMetrika.add(match[1]);
      }
    }
  }

  // Новый способ - проверяем window.yandex.metrika
  if (window.yandex && window.yandex.metrika && typeof window.yandex.metrika.reachGoal === "function") {
    const metrikaId = window.yandex.metrika.id;
    if (metrikaId) {
      metrics.yandexMetrika.add(metrikaId);
    }
  }

  // Проверка переменной window.mainMetrikaId
  if (window.mainMetrikaId) {
    metrics.yandexMetrika.add(window.mainMetrikaId);
  }

  return {
    yandexMetrika: Array.from(metrics.yandexMetrika),
    googleTagManager: Array.from(metrics.googleTagManager),
    googleAnalytics: Array.from(metrics.googleAnalytics),
    liveInternet: Array.from(metrics.liveInternet),
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

// Обертка для yandex_metrika_callbacks2
function wrapYandexMetrikaCallbacks() {
  if (!window.yandex_metrika_callbacks2) return;

  const originalPush = window.yandex_metrika_callbacks2.push;
  window.yandex_metrika_callbacks2.push = function (callback) {
    originalPush.call(this, callback);

    setTimeout(() => {
      const metricsData = getMetricsData();
      chrome.runtime.sendMessage({ action: "updateMetrics", metrics: metricsData });
    }, 0);
  };
}

// Инициализация
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getMetrics") {
    const metricsData = getMetricsData();
    sendResponse(metricsData);

    // Начинаем отслеживать изменения DOM и перехватываем yandex_metrika_callbacks2
    observeDOM();
    wrapYandexMetrikaCallbacks();
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
chrome.storage.local.get(['cssEnabled'], function (result) {
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
      // Применяем стили непосредственно к <noindex>, если дочернего контейнера нет
      if (isEnabled) {
        el.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
        el.style.border = "2px solid black";
      } else {
        el.style.backgroundColor = "";
        el.style.border = "";
      }

      // Старый подход: поиск первого контейнера
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
        el.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
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


// Подключение content script
chrome.storage.sync.get("highlightState", (data) => {
  const isHighlightActive = data.highlightState || false;
  toggleHighlightHeadings(isHighlightActive); // Применяем подсветку сразу при загрузке
});


// Функция подсветки заголовков
function toggleHighlightHeadings(isActive) {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

  headings.forEach((heading) => {
    if (isActive) {
      heading.style.backgroundColor = "#8e8e8e";

      // Добавляем информацию рядом с заголовком
      if (!heading.querySelector(".highlight-label")) {
        let label = document.createElement("span");
        label.classList.add("highlight-label");
        label.style.marginLeft = "10px";
        label.style.color = "white";
        label.textContent = `${heading.tagName}`;
        heading.appendChild(label);
      }
    } else {
      heading.style.backgroundColor = "";

      // Удаляем только добавленные метки, но не трогаем другие элементы
      let labels = heading.querySelectorAll(".highlight-label");
      labels.forEach((label) => label.remove());
    }
  });
}

// Слушаем сообщения от popup.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_HIGHLIGHT") {
    toggleHighlightHeadings(message.isActive);
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
  if (trust > 100) return "green";
  if (trust >= 0 && trust <= 30) return "red";
  if (trust >= 31 && trust <= 50) return "orange";
  if (trust >= 51 && trust <= 100) return "green";
  return "black";
}

// Функция для определения цвета Spam
function getSpamColor(spam) {
  if (spam > 100) return "red";
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

// Кэш для хранения проверенных доменов
const DOMAIN_CACHE_KEY = "domainCache";

// Функция для получения кэша доменов
function getDomainCache() {
  const cache = localStorage.getItem(DOMAIN_CACHE_KEY);
  if (cache) {
    const parsedCache = JSON.parse(cache);
    const now = Date.now();

    // Удаляем устаревшие записи (старше месяца)
    for (const domain in parsedCache) {
      if (now - parsedCache[domain].timestamp > 30 * 24 * 60 * 60 * 1000) {
        delete parsedCache[domain];
      }
    }

    // Сохраняем обновленный кэш
    localStorage.setItem(DOMAIN_CACHE_KEY, JSON.stringify(parsedCache));
    return parsedCache;
  }
  return {};
}

// Функция для сохранения данных домена в кэш
function saveDomainToCache(domain, data) {
  const cache = getDomainCache();
  cache[domain] = { ...data, timestamp: Date.now() };
  localStorage.setItem(DOMAIN_CACHE_KEY, JSON.stringify(cache));
}

// Функция для обновления информации о доменах
async function updateSiteInfo() {
  if (!functionsEnabled) return; // Проверяем, активны ли функции

  const siteLinks = document.querySelectorAll("span.site-link a");
  const domainCache = getDomainCache();

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

    // Проверяем, есть ли данные в кэше
    if (domainCache[domain]) {
      const cachedData = domainCache[domain];
      const trustColor = getTrustColor(cachedData.trust);
      const spamValue = cachedData.spam > 100 ? "100" : cachedData.spam;
      const spamColor = cachedData.spam > 100 ? "red" : getSpamColor(cachedData.spam);

      infoSpan.innerHTML = `Траст: <span style="color: ${trustColor};">${cachedData.trust}</span><br> Спам: <span style="color: ${spamColor};">${spamValue}</span>`;
      return;
    }

    // Получаем данные через API
    const data = await fetchDomainData(domain);
    if (data) {
      const trustColor = getTrustColor(data.trust);
      const spamValue = data.spam > 100 ? "100" : data.spam;
      const spamColor = data.spam > 100 ? "red" : getSpamColor(data.spam);

      infoSpan.innerHTML = `Траст: <span style="color: ${trustColor};">${data.trust}</span><br> Спам: <span style="color: ${spamColor};">${spamValue}</span>`;


      // Сохраняем данные в кэш
      saveDomainToCache(domain, data);
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

// Добавление нумерации в поисковых выдачах Яндекс и Google
$(function () {
  // Проверяем состояние из chrome storage
  chrome.storage.sync.get('numbersVisible', function (data) {
    let isNumericEnabled = data.numbersVisible || false;

    // Если нумерация включена по умолчанию, сразу добавляем ее
    if (isNumericEnabled) {
      addNumericToSearchResults();
    }

    // Слушаем сообщения от popup.js
    chrome.runtime.onMessage.addListener(function (message) {
      if (message.action === 'enableNumeric') {
        addNumericToSearchResults();
      } else if (message.action === 'disableNumeric') {
        removeNumericFromSearchResults();
      }
    });
  });

  // Функция для добавления нумерации в результаты поиска
  function addNumericToSearchResults() {
    if (location.href.indexOf('google.') != -1) {
      serp_tools.google_numeric();
      setInterval(serp_tools.google_numeric, 1000);
    }
    if (location.href.indexOf('yandex.') != -1 || location.href.indexOf('ya.') != -1) {
      serp_tools.yandex_numeric();
      setInterval(serp_tools.yandex_numeric, 1000);
    }
  }

  // Функция для удаления нумерации из результатов поиска
  function removeNumericFromSearchResults() {
    $('.matryoshka-tools-number').remove();
  }
});


var serp_tools = {};
serp_tools.$number_tpl = $('<div class="matryoshka-tools-number"></div>')
  .css({
    'text-align': 'center',
    'color': '#8e8e8e',
    'font-size': '14px',
    'margin-right': '20px',
    position: 'absolute',
    right: '100%'
  });

// получить объект с переменными для настройки SERP
serp_tools.getParamsObject = function () {
  var params = {};

  params.matryoshka_tools_lang = serp_tools.getParam('matryoshka_tools_lang');
  params.matryoshka_tools_region = serp_tools.getParam('matryoshka_tools_region');
  params.matryoshka_tools_filter = serp_tools.getParam('matryoshka_tools_filter');

  return params;
};

// получить необходимые GET параметр
serp_tools.getParam = function (name) {
  var param = location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
  return param ? param[1] : '';
};

serp_tools.cookie = function (name) {
  var matches = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : '';
};

serp_tools.set_cookie = function (name, value) {
  var domain = location.host.replace('www.', '');
  document.cookie = name + '=' + value + '; domain=.' + domain + '; path=/; expires=Mon, 01-Jan-2038 00:00:00 GMT";';
};

serp_tools.yandex_numeric = function () {
  var $number_tpl = serp_tools.$number_tpl.clone()
    .css({
      width: 15,
      top: 3,
      left: -50,
    });

  var page = location.href.match(/[&?]p=(\d+)/);
  if (page) page = page[1] * 1;
  if (isNaN(page)) page = 0;

  var onpage = 10;
  var numdoc = serp_tools.getParam('numdoc');
  if (numdoc && !isNaN(page)) onpage = numdoc;

  var isMobile = (navigator.userAgent.indexOf('iPad') != -1 || navigator.userAgent.indexOf('Mobile') != -1);
  var $items = $('#search-result:not(.serp-block_type_news-rubrics, :not(:password):has(.serp-item__label)) .serp-item:not(.serp-adv__item, .t-construct-adapter__adv, [data-j6rd], [data-fast-wzrd], [data-fast-name], :not(:password):has(.serp-item__label.serp-item__label_before_yes), :not(:password):has(.serp-adv-item__label), :not(:password):has(.serp-adv__counter), :not(:password):has(.label_color_yellow.organic__label_align_left)) a.Link:not(.organic__url_type_multiline)')
    .filter(':not([href^="http://yabs.yandex."])')
    .filter(':not([href^="https://yabs.yandex"])')
    .filter(':not([href^="//yabs.yandex"])')
    .filter(':not([href^="//m.yabs.yandex"])')
    .filter(':not([href^="http://market-click2.yandex."])')
    .filter(':not([href^="https://market-click2.yandex"])')
    .filter(':not([href^="//market-click2.yandex"])')
    .filter(':not([href^="//m.market-click2.yandex"])')
    .filter(function () {
      var href = $(this)
        .attr('href');
      if (!href) return false;

      return !$(this)
        .attr('href')
        .match(/(https?:)?\/\/(www\.)?(m\.)?yandex\.\w{2,}\/search\/ads\?/);
    })
    .filter(function () {
      var isOk = $(this)
        .is('.organic__link') || $(this)
          .is('.link_cropped_no.organic__url.link_theme_normal') || $(this)
            .is('.organic__url:not([data-event-required])') || $(this)
              .is('.SocialSnippetHeader-Link');
      if (isMobile && !isOk) isOk = $(this)
        .is('.organic__url.link_theme_normal');

      return isOk;
    })
    .filter(function () {
      return !$(this)
        .closest('[data-fast-name="entity_offers"]')
        .length;
    })
    .parent()
    .parent();

  if ($items.length == 15) onpage = 15;
  if ($items.length % 5 != 0) onpage = Math.round($items.length / 5) * 5;
  var first_n = onpage * page + 1;
  $('.matryoshka-tools-number', $items)
    .remove();

  var isMobileVersion = $('meta[name="apple-mobile-web-app-capable"]')
    .length;
  if (isMobileVersion) {
    $number_tpl.css({
      top: 48,
      right: -36,
      left: 'auto'
    });
  } else if (window.innerWidth <= 990) {
    $number_tpl.css({
      left: -36
    });
  }

  $.map($items, function (el, index) {
    var $el = $(el);
    var $number = $number_tpl.clone()
      .text(first_n + index);

    if (isMobileVersion && index === 0 && $el.closest('.serp-item:first-of-type')
      .length) {
      $number.css({
        top: 32
      });
    }
    if (isMobileVersion && $el.is('.SocialSnippet')) {
      $number.css({
        right: -21
      });
    } else {
      $el.css({
        position: 'relative'
      });
    }
    $el.append($number);
  });
};

serp_tools.google_numeric = function () {
  var $number_tpl = serp_tools.$number_tpl.clone()
    .css({
      top: 5
    });
  var start = 0;
  // Режим инкогнито (переход по страницам через ajax)
  var href = $('#ab_ctls #ab_options .ab_dropdownitem')
    .eq(0)
    .children('a')
    .attr('href');
  if (!href) href = $('#gbw .gb_fb div.gb_uc > a.gb_b')
    .eq(0)
    .attr('href');

  if (href) start = href.match(/%26start%3D(\d+)%26/);
  if (!href) start = location.href.match(/[&?]start=(\d+)/)

  if (start)
    start = start[1] * 1;
  if (isNaN(start))
    start = 0;
  var $items = $(`
        #search ._NId > .srg > .g,
        #search ._NId > .g,
        #rso > .srg > div,
        #rso div[data-hveid] > div > .srg > div,
        #rso div[data-hveid] > .mnr-c:not([data-hveid]),
        #search #rso > div > .srg > .g,
        #search #rso > div > video-voyager > .g,
        #search #rso > div > .g,
        #search #rso > div > div > .g[data-hveid$="AA"],
        #search #rso > .g,
        #rso > .g.g-blk,
        #rso > div > block-component > .g.g-blk,
        #rso > div[data-hveid] > .osrp-blk .mnr-c.xpd,
        #rso div.g[data-hveid$="AA"][data-ved],
        #Odp5De .xpdopen div.g div[data-hveid$="AA"][data-ved],
        #rso div.g[data-hveid$="AA"][jsname],
        #botstuff div.g[data-hveid$="AA"][jsname],
        #botstuff div.g div[data-hveid$="AA"][data-ved],
        div[id^="arc-srp_"] div.g[data-hveid$="AA"][data-ved],
        #rso div.g > div > div[data-hveid$="AA"][data-ved],
        div[data-hveid$="AA"] > .g > div > div > div[data-hveid$="AA"][data-ved],
        div[data-hveid$="AA"] div[data-sokoban-container],
        ul.FxLDp div[data-sokoban-container],
        ul.FxLDp > li > div > div[data-hveid$="AA"][data-ved],
        div[data-hveid$="AA"] > .xpd:not(:has(.xpd)),
        body > div > div > div > div.ezO2md,
        div[data-hveid$="AA"] div.rULfzc,
        div[data-hveid$="AA"][jsname] div.T61Aje
    `)
    .filter(':not(.obcontainer)')
    .filter(':not(.vdQmEd)')
    .filter(':not(:has(.eMXfhf))')
    .filter(':not(.no-sep):not(#imagebox_bigimages)')
    .filter(':not(.kno-kp)')
    .filter(':not(.rg-header):not(.card-section)')
    .filter(':not(:password):not(:has(.kno-ftr:contains(\'support.google.com/websearch?p%3Dfeatured_snippets\')))')
    .filter(':not(:password):not(:has([aria-level="2"][role="heading"])), :has([id^="evlb_"])')
    .filter(':not(:password):not(div[data-sokoban-container]:has(div[data-sokoban-container]))');

  $('.matryoshka-tools-number')
    .remove();

  var isMobileVersion = !!$('meta[name="viewport"][content*="width=device-width"]')
    .length;

  if (isMobileVersion) $number_tpl.css({
    top: 7,
    right: 0
  });

  var $itemsNew = [];
  $.map($items, function (el) {
    if ($(el)
      .is('.ezO2md') && !$('> div > div > a', el)
        .length) return;


    if (!$('a:not([href="#"])', el)
      .length) return;


    if ($(el)
      .parent()
      .is('div[data-hveid$="AA"]')) el = $(el)
        .parent();

    var $g = $('.g', $(el));
    if ($g.length) {
      $.map($g, function (subEl) {
        $itemsNew.push($(subEl));
      });
    } else {
      $itemsNew.push($(el));
    }
  });

  var index = start + 1;
  $.map($itemsNew, function (el) {
    if ($('.matryoshka-tools-number', el)
      .length) return;

    var $number = $number_tpl.clone()
      .text(index);

    if (isMobileVersion && $(el)
      .hasClass('card-section')) {
      $number.css({
        top: -8
      });
    }

    $(el)
      .css({
        position: 'relative'
      })
      .append($number);
    index++;
  });
};

window.addEventListener("load", () => {
  const timing = performance.timing;

  // Рассчитываем время загрузки страницы
  const loadTime = timing.domContentLoadedEventEnd - timing.navigationStart;

  // Конвертируем миллисекунды в секунды и округляем
  const loadTimeSeconds = (loadTime / 1000).toFixed(1);

  // Отправляем сообщение через background.js
  chrome.runtime.sendMessage({
    type: "SET_PAGE_LOAD_TIME",
    loadTime: loadTimeSeconds,
  });
});


(function() {
  chrome.storage.local.get(["altImgToggle"], function (data) {
      const showAlt = data.altImgToggle || false;
      toggleImages(showAlt);
  });

  // Следим за изменениями в хранилище, чтобы включать ALT при клике из popup.js
  chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (changes.altImgToggle) {
          toggleImages(changes.altImgToggle.newValue);
      }
  });

  function toggleImages(showAlt) {
      document.querySelectorAll("img").forEach(img => {
          if (showAlt) {
              if (!img.dataset.originalSrc) {
                  img.dataset.originalSrc = img.src;
              }
              if (!img.dataset.altElement) {
                  const altText = img.alt || "Нет alt";
                  const altElement = document.createElement("span");
                  altElement.textContent = altText;
                  altElement.style.cssText = `
                      display: inline-block;
                      width: ${img.width}px;
                      height: ${img.height}px;
                      background: gray;
                      color: #000;
                      text-align: center;
                      vertical-align: middle;
                      line-height: ${img.height}px;
                      font-size: 14px;
                      font-weight: bold;
                      overflow: hidden;
                  `;
                  img.style.display = "none";
                  img.after(altElement);
                  img.dataset.altElement = "true";
              }
          } else {
              if (img.dataset.altElement) {
                  img.nextElementSibling?.remove();
                  img.style.display = "inline";
                  delete img.dataset.altElement;
              }
          }
      });
  }
})();
