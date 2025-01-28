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

document.addEventListener("DOMContentLoaded", async () => {
  const tabs = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      tabContents.forEach((content) => {
        content.classList.remove("active");
      });
      document.getElementById(tab.getAttribute("data-tab")).classList.add("active");
    });
  });

  // Загрузка SEO данных
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: scrapeSEOData,
    },
    (results) => {
      const seoData = results[0].result;

      populateMetaData("title", seoData.title);
      populateMetaData("description", seoData.description);
      populateMetaData("keywords", seoData.keywords);
      populateMetaData("h1", seoData.h1);
      
      document.getElementById("current-url").innerHTML = tab.url 
              ? `<a href="${tab.url}" target="_blank">${tab.url}</a>` 
              : "Не удалось определить";
      //document.getElementById("links").textContent = seoData.linksCount || "N/A";
      //document.getElementById("images-count").textContent = seoData.imagesCount || "N/A";
      document.getElementById("lang").textContent = seoData.lang || "Не удалось определить";

      
      populateMicrodata("open-graph", seoData.openGraph, "");
      populateMicrodata("twitter-cards", seoData.twitterCards, "");
      populateMicrodata("schema-org", seoData.schemaOrg, "");
      populateMicrodata("rdfa", seoData.rdfa, "");
      populateMicrodata("microdata-check", seoData.microdata, "");

     
    }
  );

  let cssEnabled = true; // По умолчанию стили включены

// Загружаем сохраненное состояние при старте
chrome.storage.local.get(['cssEnabled'], function(result) {
  cssEnabled = result.cssEnabled !== undefined ? result.cssEnabled : true; // Восстанавливаем состояние из памяти
  updateButtonState(cssEnabled); // Обновляем состояние кнопки при загрузке
});

// Обработчик для кнопки включения/отключения CSS
document.getElementById("toggle-css").addEventListener("click", () => {
  cssEnabled = !cssEnabled; // Переключаем состояние CSS
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    toggleStyles(tabs[0].id); // Применяем изменения на активной вкладке
  });
  updateButtonState(cssEnabled); // Обновляем состояние кнопки
  // Сохраняем состояние в памяти
  chrome.storage.local.set({ cssEnabled });
});

// Функция для отключения/включения CSS
function toggleStyles(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const links = document.querySelectorAll("link[rel='stylesheet']");
      links.forEach((link) => {
        link.disabled = !link.disabled; // Переключаем свойство disabled у стилей
      });
    },
  });
}

// Функция для обновления состояния кнопки
function updateButtonState(isEnabled) {
  const button = document.getElementById("toggle-css");
  const icon = button.querySelector('i');

  if (isEnabled) {
    button.classList.add("active");
    icon.classList.remove("fa-toggle-off");
    icon.classList.add("fa-toggle-on");
  } else {
    button.classList.remove("active");
    icon.classList.remove("fa-toggle-on");
    icon.classList.add("fa-toggle-off");
  }
}

});

let noIndexActive = false;
let noFollowActive = false;

// Загружаем сохраненные значения при старте
chrome.storage.local.get(['noIndexActive', 'noFollowActive'], function (result) {
  noIndexActive = result.noIndexActive || false;
  noFollowActive = result.noFollowActive || false;

  // Обновляем состояние кнопок
  updateButtonState("highlight-noindex", noIndexActive);
  updateButtonState("highlight-nofollow", noFollowActive);
});

// Обработчик для кнопки подсветки noindex
document.getElementById("highlight-noindex").addEventListener("click", () => {
  noIndexActive = !noIndexActive;
  updateButtonState("highlight-noindex", noIndexActive);
  chrome.storage.local.set({ noIndexActive });

  // Применяем изменения на текущей вкладке
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "updateHighlight",
      highlightType: "noindex",
      isEnabled: noIndexActive,
    });
  });
});

// Обработчик для кнопки подсветки nofollow
document.getElementById("highlight-nofollow").addEventListener("click", () => {
  noFollowActive = !noFollowActive;
  updateButtonState("highlight-nofollow", noFollowActive);
  chrome.storage.local.set({ noFollowActive });

  // Применяем изменения на текущей вкладке
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "updateHighlight",
      highlightType: "nofollow",
      isEnabled: noFollowActive,
    });
  });
});

// Функция для обновления состояния кнопок
function updateButtonState(buttonId, isActive) {
  const button = document.getElementById(buttonId);
  const icon = button.querySelector("i");

  if (isActive) {
    button.classList.add("active");
    icon.classList.remove("fa-toggle-off");
    icon.classList.add("fa-toggle-on");
  } else {
    button.classList.remove("active");
    icon.classList.remove("fa-toggle-on");
    icon.classList.add("fa-toggle-off");
  }
}




// Функция для обновления длины и окрашивания текста
function updateMetaLengthStyles(element, length, ranges, isMissing) {
  if (!element) return;

  // Если данные отсутствуют, устанавливаем серый цвет и жирный шрифт
  if (isMissing) {
    element.style.color = "red";  // Серый цвет для отсутствующих данных
    //element.style.fontWeight = "bold";  // Жирный шрифт для отсутствующих данных
    return;
  }

  // Если данные присутствуют, вычисляем цвет по диапазонам
  if (length >= ranges.good[0] && length <= ranges.good[1]) {
    element.style.color = "green";  // Хорошо
    //element.style.fontWeight = "bold";
  } else if (
    (length >= ranges.acceptable[0] && length <= ranges.acceptable[1]) ||
    (length >= ranges.acceptable[2] && length <= ranges.acceptable[3])
  ) {
    element.style.color = "orange";  // Приемлемо
    //element.style.fontWeight = "bold";
  } else {
    element.style.color = "red";  // Плохо
    //element.style.fontWeight = "bold";
  }
}

// Функция для заполнения мета-данных
// Функция для заполнения мета-данных
function populateMetaData(id, value) {
  const element = document.getElementById(id);
  const lengthElement = document.getElementById(`${id}-length`);

  // Обработка для H1
  if (id === 'h1') {
    const h1Tags = value || []; // Если value пустое, используем пустой массив
    const h1Count = h1Tags.length;

    if (h1Count === 0) {
      element.textContent = "Отсутствует";
      lengthElement.textContent = `Символов: ${h1Count}`;
      lengthElement.style.color = "red"; // Красим текст длины
    } else if (h1Count === 1) {
      element.textContent = h1Tags[0]; // Один H1 выводим как текст
      const displayedLength = h1Tags[0].length;
      lengthElement.textContent = `Символов: ${displayedLength}`;
      // Вызываем updateMetaLengthStyles для определения цвета
      updateMetaLengthStyles(lengthElement, displayedLength, {
        good: [20, 60],
        acceptable: [5, 19, 61, 70],
      }, false); // Здесь isMissing явно false, так как значение присутствует
    } else {
      // Несколько H1 выводим с нумерацией
      element.innerHTML = h1Tags.map((h1, index) => ` <div>${index + 1}. ${h1}</div>`).join("");
      lengthElement.textContent = `Количество: ${h1Count}`;
      lengthElement.style.color = "red";
    }
    return;
  }

  // Проверка на отсутствие значения: если значение пустое или состоит только из пробелов
  const isMissing = !value || value.trim() === "" || value === "Отсутствует";  // Проверяем на пустую строку и на null/undefined

  const normalizeText = (str) => str.normalize('NFC').replace(/\s+/g, ' ').trim();
  const cleanedValue = isMissing ? "" : normalizeText(value);

  element.textContent = isMissing ? "Отсутствует" : cleanedValue;

  const displayedLength = cleanedValue.length;
  lengthElement.textContent = `Символов: ${displayedLength}`; // Отображаем длину

  // Устанавливаем стиль длины для разных мета-данных
  if (id === 'title') {
    updateMetaLengthStyles(lengthElement, displayedLength, {
      good: [30, 70],
      acceptable: [10, 29, 71, 90],
    }, isMissing);
  } else if (id === 'description') {
    updateMetaLengthStyles(lengthElement, displayedLength, {
      good: [150, 250],
      acceptable: [75, 149, 251, 300],
    }, isMissing);
  }
}




// Копирование мета-тегов
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      
      chrome.scripting.executeScript(
          {
              target: { tabId: tab.id },
              func: scrapeSEOData,
          },
          (results) => {
              if (!results || results.length === 0 || !results[0].result) {
                  //console.error("Данные не получены из scrapeSEOData.");
                  return;
              }

              const seoData = results[0].result;

              // Заполняем мета-данные и стили
              populateMetaData("title", seoData.title);
              populateMetaData("description", seoData.description);
              populateMetaData("h1", seoData.h1);
              populateMetaData("keywords", seoData.keywords);

              // Отображаем URL и язык
              document.getElementById("current-url").innerHTML = tab.url 
              ? `<a href="${tab.url}" target="_blank">${tab.url}</a>` 
              : "Не удалось определить";
              document.getElementById("lang").textContent = seoData.lang || "Не удалось определить";

              
          }
      );
  });
});


// Функция микроразметки
function populateMicrodata(elementId, data, label) {
  const container = document.getElementById(elementId);
  container.innerHTML = ""; 

  if (data && data.length > 0) {
    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "microdata-item";

      // Проверка, если это JSON-LD или другие сложные данные
      if (item.trim().startsWith("{") || item.trim().startsWith("[")) {
        try {
          const parsedData = JSON.parse(item);
          const formattedJson = JSON.stringify(parsedData, null, 2);  // Форматируем JSON
          div.textContent = formattedJson;  // Добавляем отформатированный JSON
        } catch (e) {
          div.textContent = item;  // Если не удалось распарсить, выводим как есть
        }
      } else {
        div.textContent = item;  // Обычный текст
      }

      container.appendChild(div);
    });
  } else {
    container.textContent = `${label} Отсутствует`;
  }
}

// Функция для извлечения SEO данных
function scrapeSEOData() {
  // Функция для извлечения структурированных данных, таких как OpenGraph, Twitter и т. д.
  const extractStructuredData = (selector, attribute = "content") => {
    return Array.from(document.querySelectorAll(selector)).map(el => {
      const property = el.getAttribute("property") || el.getAttribute("name");
      const content = el.getAttribute(attribute) || el.outerHTML;
      return `${property}: ${content}`;
    });
  };

  // Извлекаем мета-данные
  return {
    title: document.querySelector("title")?.textContent || "Отсутствует", // textContent вместо innerText
    description: document.querySelector('meta[name="description"]')?.content || "Отсутствует",
    keywords: document.querySelector('meta[name="keywords"]')?.content || "Отсутствует",
    h1: Array.from(document.querySelectorAll("h1")).map(h1 => h1.textContent.trim()) || [], // Собираем все H1
    linksCount: document.querySelectorAll("a[href]").length,  // Количество ссылок на странице
    imagesCount: document.querySelectorAll("img").length,  // Количество изображений на странице
    lang: document.documentElement.lang || "Отсутствует", // Язык страницы
    siteIP: location.host,  // IP сайта, если доступен

    // Извлекаем специфические мета-данные
    openGraph: extractStructuredData('meta[property^="og:"]'),
    twitterCards: extractStructuredData('meta[name^="twitter:"]'),
    schemaOrg: extractStructuredData('[type="application/ld+json"]', "textContent"),  // Для JSON-LD
    rdfa: extractStructuredData('[prefix]'),
    microdata: extractStructuredData('[itemscope]'),
  };
}


document.addEventListener('DOMContentLoaded', () => {
  // Слушатели для кнопок во вкладке "Поиск"

  document.getElementById('check-index-google').addEventListener('click', () => {
      getCurrentUrl((url) => {
          openTab(`https://www.google.com/search?q=site:${encodeURIComponent(url)}`);
      });
  });

  document.getElementById('operator-site-yandex').addEventListener('click', () => {
      getCurrentUrl((url) => {
          openTab(`https://yandex.ru/search/?text=site:${encodeURIComponent(url)}`);
      });
  });

  document.getElementById('operator-url-yandex').addEventListener('click', () => {
      getCurrentUrl((url) => {
          openTab(`https://yandex.ru/search/?text=url:${encodeURIComponent(url)}/* | url:www.${encodeURIComponent(url)}/* | url:${encodeURIComponent(url)} | url:www.${encodeURIComponent(url)}`);
      });
  });

  document.getElementById('operator-host-yandex').addEventListener('click', () => {
    getCurrentUrl((url) => {
        openTab(`https://yandex.ru/search/?text=host:${encodeURIComponent(url)}`);
    });
});

  // Обработчик клика на кнопку
  document.getElementById('operator-title-yandex').addEventListener('click', function() {
    // Получаем информацию о текущей вкладке
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        let tab = tabs[0];
        let pageTitle = tab.title;  // Заголовок страницы
        let currentDomain = new URL(tab.url).hostname;  // Домен сайта

        // Формируем запрос для поиска в Яндексе
        let searchQuery = `title:("${pageTitle}") site:${currentDomain}`;

        // Формируем URL для поиска в Яндексе
        let searchUrl = `https://yandex.ru/search/?text=${encodeURIComponent(searchQuery)}`;

        // Открываем поиск в новой вкладке
        chrome.tabs.create({ url: searchUrl });
    });
});

 
// Обработчик кнопки "Я" для Яндекс.Карт
document.getElementById('search-yandex-maps').addEventListener('click', () => {
  // Показываем блок с вводом для Яндекс
  document.getElementById('yandex-search-input').style.display = 'block';
  // Скрываем блок для Google
  document.getElementById('google-search-input').style.display = 'none';
});

// Обработчик кнопки "G" для Google.Карт
document.getElementById('search-google-maps').addEventListener('click', () => {
  // Показываем блок с вводом для Google
  document.getElementById('google-search-input').style.display = 'block';
  // Скрываем блок для Яндекс
  document.getElementById('yandex-search-input').style.display = 'none';
});

// Обработчик кнопки "Проверить" для Яндекс.Карт
document.getElementById('yandex-check').addEventListener('click', () => {
  const organization = document.getElementById('yandex-input').value;
  if (organization) {
    openTab(`https://yandex.ru/maps/?text=${encodeURIComponent(organization)}`);
  } else {
  }
});

// Обработчик кнопки "Проверить" для Google.Карт
document.getElementById('google-check').addEventListener('click', () => {
  const organization = document.getElementById('google-input').value;
  if (organization) {
    openTab(`https://www.google.com/maps/search/${encodeURIComponent(organization)}`);
  } else {
  }
});

// Функция для открытия новой вкладки
function openTab(url) {
  window.open(url, '_blank');
}




  // Функция для получения текущего URL
  function getCurrentUrl(callback) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          callback(tabs[0].url);
      });
  }

  // Функция для открытия новой вкладки
  function openTab(url) {
      chrome.tabs.create({ url });
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const linksContainer = document.getElementById("links-details");
  let allLinks = [];
  let displayedLinks = [];
  let currentHost = "";

  // Функция для сбора ссылок
  function fetchLinks() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      currentHost = new URL(tab.url).origin;

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: collectLinks,
        },
        (results) => {
          if (chrome.runtime.lastError || !results || !results[0]) {
            //console.error("Ошибка при сборе ссылок.");
            return;
          }

          allLinks = results[0].result;
          displayedLinks = [...allLinks];
          updateCounts();
          displayLinks(displayedLinks);
        }
      );
    });
  }
  function collectLinks() {
    // Сбор ссылок из всех ссылок <a>
    const links = Array.from(document.querySelectorAll("a")).map(link => {
      const href = link.getAttribute("href") || "";
      let fullHref = href;
  
      // Пропускаем ссылки, которые начинаются с "mailto:" или "tel:"
      if (!href.startsWith("mailto:") && !href.startsWith("tel:")) {
        // Проверка на валидность URL
        try {
          fullHref = new URL(href, window.location.origin).href;
        } catch (e) {
          // Если ошибка, значит URL невалидный, пропускаем его
          fullHref = null;
        }
      }
  
      if (fullHref === null) return null;  // Пропускаем некорректные ссылки
  
      const protocol = new URL(fullHref).protocol.split(":")[0]; 
      const rel = link.getAttribute("rel") || ""; 
      const text = link.innerText.trim() || link.querySelector("img")?.alt || "Без анкора"; 
      const visible = link.offsetParent !== null && getComputedStyle(link).display !== "none"; 
  
      return {
        href: fullHref,
        protocol: protocol,
        rel: rel.toLowerCase(),
        text: text,
        visible: link.offsetWidth > 0 && link.offsetHeight > 0, // Проверка видимости
        status: null // Статус будет заполняться позже
      };
    }).filter(link => link !== null);  // Фильтруем все ссылки, которые равны null
  
    // Теперь добавим ссылки для .js и .css
    const scriptLinks = Array.from(document.querySelectorAll("script[src]")).map(script => {
      const href = script.getAttribute("src");
      let fullHref = href;
  
      // Проверка на валидность URL
      try {
        fullHref = new URL(href, window.location.origin).href;
      } catch (e) {
        fullHref = null;
      }
  
      if (fullHref === null) return null;  // Пропускаем некорректные ссылки
  
      return {
        href: fullHref,
        protocol: new URL(fullHref).protocol.split(":")[0],
        rel: '',
        text: "Script",
        visible: true,
        status: null
      };
    }).filter(script => script !== null);
  
    const cssLinks = Array.from(document.querySelectorAll("link[rel='stylesheet'][href]")).map(link => {
      const href = link.getAttribute("href");
      let fullHref = href;
  
      // Проверка на валидность URL
      try {
        fullHref = new URL(href, window.location.origin).href;
      } catch (e) {
        fullHref = null;
      }
  
      if (fullHref === null) return null;  // Пропускаем некорректные ссылки
  
      return {
        href: fullHref,
        protocol: new URL(fullHref).protocol.split(":")[0],
        rel: link.getAttribute("rel"),
        text: "CSS",
        visible: true,
        status: null
      };
    }).filter(css => css !== null);
  
    // Объединяем все ссылки
    const allLinks = [...links, ...scriptLinks, ...cssLinks];
  
    //console.log("Собранные ссылки:", allLinks);  // Диагностика
    return allLinks;
  }
  

  function displayLinks(linksToDisplay) {
    linksContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых ссылок
  
    linksToDisplay.forEach(link => {
      const linkElement = document.createElement('div');
      linkElement.classList.add('link-detail');
      linkElement.innerHTML = `
        <span>Анкор: ${link.text}</span>
        <span>Протокол: ${link.protocol}</span>
      <span>Атрибут rel: ${link.rel || 'Отсутствует'}</span>
        <span>Видимость: ${link.visible ? 'Да' : 'Нет'}</span>
        <span>Ссылка: <a href="${link.href}" target="_blank">${link.href}</a></span>
        <span>Код ответа: <span class="status-text">${link.status || "Не проверено"}</span></span>
        ${link.redirectTo ? `<span class="redirect-url">Редирект на: <a href="${link.redirectTo}" target="_blank">${link.redirectTo}</a></span>` : ''}
      `;
      linksContainer.appendChild(linkElement);
    });
  }

  // Функция для обновления счетчиков
  function updateCounts() {
    const internalLinks = allLinks.filter((link) => isInternal(link));
    const externalLinks = allLinks.filter((link) => !isInternal(link));
    const jsLinks = allLinks.filter((link) => /\.(js|mjs|min\.js|jsx|ts|tsx)(\?|$)/i.test(link.href));
  const cssLinks = allLinks.filter((link) => /\.css(\?|$)/i.test(link.href));
  const pdfLinks = allLinks.filter((link) => /\.pdf($|\?)/i.test(link.href));
  const excelLinks = allLinks.filter((link) => /\.(xls|xlsx)($|\?)/i.test(link.href));
  const wordLinks = allLinks.filter((link) => /\.(doc|docx)($|\?)/i.test(link.href));

    document.getElementById("total-links").textContent = allLinks.length;
    document.getElementById("internal-links").textContent = internalLinks.length;
    document.getElementById("external-links").textContent = externalLinks.length;

    document.getElementById("https-links").textContent = allLinks.filter((link) => link.protocol === "https").length;
    document.getElementById("http-links").textContent = allLinks.filter((link) => link.protocol === "http").length;
    document.getElementById("other-links").textContent = allLinks.filter((link) => !["http", "https"].includes(link.protocol)).length;

    document.getElementById("follow-links").textContent = allLinks.filter((link) => !link.rel.includes("nofollow")).length;
    document.getElementById("nofollow-links").textContent = allLinks.filter((link) => link.rel.includes("nofollow")).length;
    document.getElementById("other-attributes").textContent = allLinks.filter((link) => link.rel && !link.rel.includes("nofollow") && !link.rel.includes("follow")).length;
  


    // Обновляем количество для каждого типа ссылки
    document.getElementById("js-links").textContent = jsLinks.length;
    document.getElementById("css-links").textContent = cssLinks.length;
    document.getElementById("pdf-links").textContent = pdfLinks.length;
    document.getElementById("excel-links").textContent = excelLinks.length;
    document.getElementById("word-links").textContent = wordLinks.length;
  }

  function isInternal(link) {
    if (link.protocol === "mailto:" || link.protocol === "tel:") {
      return true;
    }
    try {
      const linkUrl = new URL(link.href);
      const currentUrl = new URL(currentHost);
  
      // Сравниваем хосты, игнорируя различия в протоколе
      return linkUrl.host === currentUrl.host;
    } catch {
      return false;
    }
  }

  function filterLinks(type) {
    switch (type) {
      case "all":
        displayedLinks = allLinks;
        break;
      case "internal":
        displayedLinks = allLinks.filter((link) => isInternal(link));
        break;
      case "external":
        displayedLinks = allLinks.filter((link) => !isInternal(link));
        break;
      case "https":
        displayedLinks = allLinks.filter((link) => link.protocol === "https");
        break;
      case "http":
        displayedLinks = allLinks.filter((link) => link.protocol === "http");
        break;
      case "other":
        displayedLinks = allLinks.filter((link) => !["http", "https"].includes(link.protocol));
        break;
      case "follow":
        displayedLinks = allLinks.filter((link) => !link.rel.includes("nofollow"));
        break;
      case "nofollow":
        displayedLinks = allLinks.filter((link) => link.rel.includes("nofollow"));
        break;
      case "other-attributes":
        displayedLinks = allLinks.filter((link) => 
          (
            link.rel.includes("noopener") || 
            link.rel.includes("noreferrer") || 
            link.rel.includes("sponsored") || 
            link.rel.includes("ugc") || 
            link.rel.includes("stylesheet") ||
            link.rel.includes("alternate") ||
            link.rel.includes("author") ||
            link.rel.includes("bookmark") ||
            link.rel.includes("canonical") ||
            link.rel.includes("dns-prefetch") ||
            link.rel.includes("external") ||
            link.rel.includes("help") ||
            link.rel.includes("icon") ||
            link.rel.includes("license") ||
            link.rel.includes("manifest") ||
            link.rel.includes("modulepreload") ||
            link.rel.includes("pingback") ||
            link.rel.includes("preconnect") ||
            link.rel.includes("prefetch") ||
            link.rel.includes("preload") ||
            link.rel.includes("prerender") ||
            link.rel.includes("search") ||
            link.rel.includes("tag") ||
            link.rel.includes("next") ||
            link.rel.includes("prev")
          ) &&
          !link.rel.includes("nofollow")
        );        
        break;
        case "js":
  // Фильтрация .js ссылок (также учитываем возможные параметры в URL)
  displayedLinks = allLinks.filter((link) => {
    const isJs = /\.(js|mjs|min\.js)(\?|$)/i.test(link.href);
    return isJs;
  });
  break;
  case "css":
    // Фильтрация .css ссылок
    displayedLinks = allLinks.filter((link) => {
      const isCss = /\.css(\?|$)/i.test(link.href);
      return isCss;
    });
    break;
        case "pdf":
          displayedLinks = allLinks.filter((link) => /\.pdf($|\?)/i.test(link.href)); // Регулярное выражение для .pdf
          break;
        case "excel":
          displayedLinks = allLinks.filter((link) => /\.(xls|xlsx)($|\?)/i.test(link.href)); // Регулярное выражение для .xls и .xlsx
          break;
        case "word":
          displayedLinks = allLinks.filter((link) => /\.(doc|docx)($|\?)/i.test(link.href)); // Регулярное выражение для .doc и .docx
          break;
      default:
        displayedLinks = [];
        break;
    }
    displayLinks(displayedLinks);
  }

  const linkStatuses = {
    200: [],
    300: [],
    400: [],
    500: [],
    error: []
  };
  async function checkLinksStatus() {
    const statusElements = linksContainer.querySelectorAll(".link-detail");
  
    for (let i = 0; i < statusElements.length; i++) {
      const link = displayedLinks[i];
      const statusText = statusElements[i].querySelector(".status-text");
      const redirectUrlElement = statusElements[i].querySelector(".redirect-url");
  
      // Пропускаем ссылки, которые не нужно проверять (mailto, tel, javascript)
      if (link.href.startsWith("mailto:") || link.href.startsWith("tel:") || link.href.startsWith("javascript:void(0)")) {
        statusText.textContent = "Ссылка не проверяется";
        continue;
      }
  
      // Если статус уже был определен, просто выводим его
      if (link.status !== null) {
        statusText.textContent = `${link.status}`;
        if (redirectUrlElement) {
          redirectUrlElement.textContent = link.redirectTo || "Нет редиректа";
        }
        updateLinkStatusClass(statusText, link.status);
        continue;
      }
  
      statusText.textContent = "Проверка...";
  
      try {
        const response = await fetch(link.href, { method: 'HEAD', redirect: 'manual' });
        const status = response.status;
  
        // Если статус 0 (ошибка или редирект), сохраняем информацию
        if (status === 0) {
          statusText.textContent = "301/302";
          const redirectedUrl = response.headers.get("Location");
          if (redirectedUrl) {
            link.redirectTo = redirectedUrl;  // Сохраняем адрес редиректа
            if (redirectUrlElement) {
              redirectUrlElement.innerHTML = `Редирект на: <a href="${link.redirectTo}" target="_blank">${link.redirectTo}</a>`;
            }
          }
          // Добавляем в фильтр 3xx для редиректов или ошибки в 5xx
          link.status = `301/302`; // Сохраняем ошибку или редирект
          linkStatuses[300].push(link);  // Если это редирект
          updateStatusButton(300);
        } else {
          link.status = status; // Сохраняем статус
          statusText.textContent = `${status}`;
          if (redirectUrlElement) {
            redirectUrlElement.textContent = link.redirectTo || "Нет редиректа";
          }
  
          // Сортировка по статусу для статистики
          if (status >= 200 && status < 300) {
            linkStatuses[200].push(link);
            updateStatusButton(200);
          } else if (status >= 300 && status < 400) {
            linkStatuses[300].push(link);
            updateStatusButton(300);
          } else if (status >= 400 && status < 500) {
            linkStatuses[400].push(link);
            updateStatusButton(400);
          } else if (status >= 500 && status < 600) {
            linkStatuses[500].push(link);
            updateStatusButton(500);
          }
        }
  
        updateLinkStatusClass(statusText, link.status);
  
      } catch (error) {
        // Если произошла ошибка (например, ошибка сети), считаем, что это ошибка сервера (500)
        statusText.textContent = "500";
        if (redirectUrlElement) {
          redirectUrlElement.textContent = "";
        }
        link.status = 500; // Ошибка сервера
        linkStatuses[500].push(link); // Добавляем в фильтр 5xx
        updateStatusButton(500);
      }
    }
  }
  
  
  
  
  function updateStatusButton(statusCode) {
    const button = document.getElementById(`status-${statusCode}-links`);
    const count = linkStatuses[statusCode].length;
    button.textContent = `${getStatusText(statusCode)}${count}`;
  }

  function getStatusText(statusCode) {
    switch (statusCode) {
      case 200:
        return "";
      case 300:
        return "";
      case 400:
        return "";
      case 500:
        return "";
      default:
        return "Неизвестный код";
    }
  }

  function filterLinksByStatus(status) {
    displayedLinks = linkStatuses[status];
    displayLinks(displayedLinks);
  }

  function updateLinkStatusClass(statusElement, status) {
    statusElement.classList.remove("status-200", "status-300", "status-400", "status-500");
    if (status >= 200 && status < 300) {
      statusElement.classList.add("status-200");
    } else if (status >= 300 && status < 400) {
      statusElement.classList.add("status-300");
    } else if (status >= 400 && status < 500) {
      statusElement.classList.add("status-400");
    } else if (status >= 500 && status < 600) {
      statusElement.classList.add("status-500");
    }
  }

  document.getElementById("check-links-status").addEventListener("click", checkLinksStatus);

  // Фильтры на кнопках
  document.getElementById("show-all-links").addEventListener("click", () => filterLinks("all"));
  document.getElementById("show-internal-links").addEventListener("click", () => filterLinks("internal"));
  document.getElementById("show-external-links").addEventListener("click", () => filterLinks("external"));
  document.getElementById("show-https-links").addEventListener("click", () => filterLinks("https"));
  document.getElementById("show-http-links").addEventListener("click", () => filterLinks("http"));
  document.getElementById("show-other-protocols").addEventListener("click", () => filterLinks("other"));
  document.getElementById("show-follow-links").addEventListener("click", () => filterLinks("follow"));
  document.getElementById("show-nofollow-links").addEventListener("click", () => filterLinks("nofollow"));
  document.getElementById("show-other-attributes").addEventListener("click", () => filterLinks("other-attributes"));
// Обработчики для кнопок фильтрации по статусу
document.getElementById("show-status-200").addEventListener("click", () => filterLinksByStatus(200));
document.getElementById("show-status-300").addEventListener("click", () => filterLinksByStatus(300));
document.getElementById("show-status-400").addEventListener("click", () => filterLinksByStatus(400));
document.getElementById("show-status-500").addEventListener("click", () => filterLinksByStatus(500));

document.getElementById("show-js-links").addEventListener("click", () => filterLinks("js"));
  document.getElementById("show-css-links").addEventListener("click", () => filterLinks("css"));
  document.getElementById("show-pdf-links").addEventListener("click", () => filterLinks("pdf"));
  document.getElementById("show-excel-links").addEventListener("click", () => filterLinks("excel"));
  document.getElementById("show-word-links").addEventListener("click", () => filterLinks("word"));
  
// Функция для копирования всех ссылок в буфер обмена
function copyLinksToClipboard() {
  const linksText = displayedLinks.map(link => link.href).join("\n");

  navigator.clipboard.writeText(linksText)
    .then(() => {
      //alert("Ссылки скопированы в буфер обмена!");
    })
    .catch(err => {
      //console.error("Ошибка при копировании ссылок: ", err);
    });
}

// Функция для экспорта ссылок в CSV файл с кодировкой UTF-8
function exportLinksToCSV() {
  const csvRows = [];
  const headers = ["Анкор", "Ссылка", "Протокол", "Атрибут rel", "Видимость", "Код ответа"];
  csvRows.push(headers.join(";")); // Заменяем запятую на точку с запятой

  displayedLinks.forEach(link => {
    const row = [
      link.text,
      link.href,
      link.protocol,
      link.rel,
      link.visible ? "Да" : "Нет",
      link.status || "Не проверено"
    ];
    csvRows.push(row.join(";")); // Заменяем запятую на точку с запятой
  });

  // Добавляем BOM для корректного отображения UTF-8
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvRows.join("\n"));
  const downloadLink = document.createElement("a");
  downloadLink.setAttribute("href", csvContent);
  downloadLink.setAttribute("download", "links.csv");
  downloadLink.click();
}

// Добавляем обработчики для кнопок
document.getElementById("copy-links").addEventListener("click", copyLinksToClipboard);
document.getElementById("export-links").addEventListener("click", exportLinksToCSV);

// Загрузка ссылок при старте
fetchLinks();


});



document.addEventListener("DOMContentLoaded", function () {
  const imageSummaryButtons = document.querySelectorAll("#image-summary button");
  const imageList = document.getElementById("image-list");
  const checkStatusButton = document.getElementById("check-status");

  let cachedImages = []; // Храним изображения с их статусами
  

  function updateImageDetails(filter, images) {
    imageList.innerHTML = ""; // Очистка списка изображений

    let filteredImages;
    switch (filter) {
      case "all":
        filteredImages = images;
        break;
      case "empty-alt":
        filteredImages = images.filter(img => img.alt === "");
        break;
      case "missing-alt":
        filteredImages = images.filter(img => !img.hasAlt);
        break;
      case "filled-alt":
        filteredImages = images.filter(img => img.alt && img.alt !== "");
        break;
      case "status-200":
        filteredImages = images.filter(img => img.status === 200);
        break;
      case "status-404":
        filteredImages = images.filter(img => img.status === 404);
        break;
        case "up-500":
        filteredImages = images.filter(img => img.sizeInKB > 500);
        break;
      case "low-500":
        filteredImages = images.filter(img => img.sizeInKB <= 500);
        break;
        case "imagecss":
      // Фильтрация изображений, найденных в CSS
      filteredImages = images.filter(img => img.isInCSS);
      //console.log("Изображения в CSS:", filteredImages); 
      break;
      default:
        filteredImages = images;
    }

    filteredImages.forEach(img => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.marginBottom = "10px";

      // Предпросмотр изображения
      const imgPreview = document.createElement("img");
      imgPreview.src = img.src;
      imgPreview.alt = img.alt || "Нет атрибута alt";
      imgPreview.title = img.title;
      imgPreview.style.maxWidth = "50px";
      imgPreview.style.maxHeight = "50px";
      imgPreview.style.marginRight = "10px";

      // Информация об изображении
      const infoContainer = document.createElement("div");
      infoContainer.style.display = "flex";
      infoContainer.style.flexDirection = "column";

      // Информация о alt
      const altText = document.createElement("span");
      if (img.alt === "") {
        altText.textContent = 'Атрибут alt: Пустой';
      } else if (img.alt) {
        altText.textContent = `Атрибут alt: "${img.alt}"`;
      } else {
        altText.textContent = "Атрибут alt: Отсутствует";
      }

      // Проверяем наличие свойства title
    const titleText = document.createElement("span");
    if (img.title) {
      titleText.textContent = `Атрибут title: ${img.title}`;
    } else {
      titleText.textContent = "Атрибут title: Отсутствует";
    }

      const formatText = document.createElement("span");
      formatText.textContent = `Формат: ${img.format}`;

      const sizeText = document.createElement("span");
      sizeText.textContent = `Размер: ${img.width}x${img.height}px`;

      const weightText = document.createElement("span");
      weightText.textContent = `Вес: ${img.sizeInKB} КБ`;

      // Создаем элемент ссылки для URL
      const urlText = document.createElement("a");
      urlText.textContent = img.src;
      urlText.href = img.src;
      urlText.target = "_blank";  // Открывать ссылку в новой вкладке

      // Создаем элемент для текста "Источник: "
      const text = document.createElement("span");
      text.textContent = "Ссылка: ";

      text.appendChild(urlText);

      const statusText = document.createElement("span");
      // Если статус ещё не проверен, то показываем "Не проверено"
      statusText.textContent = img.status === undefined ? "Код ответа: Не проверено" : `Код ответа: ${img.status}`;

      // Добавляем информацию в контейнер
      infoContainer.appendChild(altText);
      infoContainer.appendChild(titleText); 
      infoContainer.appendChild(formatText);
      infoContainer.appendChild(sizeText);
      infoContainer.appendChild(weightText);
      infoContainer.appendChild(text);
      infoContainer.appendChild(statusText);

      // Собираем всё в элемент списка
      li.appendChild(imgPreview);
      li.appendChild(infoContainer);
      imageList.appendChild(li);
    });

    // Обновляем счетчики
    document.getElementById("total-images").textContent = images.length;
    document.getElementById("empty-alt-count").textContent = images.filter(img => img.alt === "").length;
    document.getElementById("missing-alt-count").textContent = images.filter(img => !img.hasAlt).length;
    document.getElementById("filled-alt-count").textContent = images.filter(img => img.alt && img.alt !== "").length;
    document.getElementById("status-200-count").textContent = images.filter(img => img.status === 200).length;
    document.getElementById("status-404-count").textContent = images.filter(img => img.status === 404).length;
    document.getElementById("up-500-count").textContent = images.filter(img => img.sizeInKB > 500).length;  // Обновляем счетчик для "больше 500 КБ"
    document.getElementById("low-500-count").textContent = images.filter(img => img.sizeInKB <= 500).length;  // Обновляем счетчик для "меньше 500 КБ"
    document.getElementById("image-css").textContent = images.filter(img => img.isInCSS).length;  // Добавляем фильтр для CSS
  }

  function fetchImages(filter = "all") {
    const imagesToUse = cachedImages.length > 0 ? cachedImages : []; // Используем кэшированные данные, если они есть
    updateImageDetails(filter, imagesToUse);  // Обновляем список изображений с фильтром
  }

  function checkStatus(images) {
    // Устанавливаем всем изображениям статус "не проверен"
    const imagesWithInitialStatus = images.map(img => ({ ...img, status: undefined }));
    cachedImages = imagesWithInitialStatus; // Обновляем кэш
    updateImageDetails("all", imagesWithInitialStatus);

    // Меняем текст на "Проверка..." на всех изображениях
    const statusTextElements = document.querySelectorAll('li span');
    statusTextElements.forEach(span => {
      if (span.textContent === "Код ответа: Не проверено") {
        span.textContent = "Код ответа: Проверка...";
      }
    });

    const promises = images.map(img =>
      fetch(img.src, { method: "HEAD" })
        .then(response => ({ ...img, status: response.status }))
        .catch(() => ({ ...img, status: 404 }))
    );

    // После получения всех ответов обновляем кэш и выводим изображения
    Promise.all(promises).then(updatedImages => {
      cachedImages = updatedImages; // Сохраняем данные в кэш
      updateImageDetails("all", updatedImages);
    });
  }

  imageSummaryButtons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");
      fetchImages(filter);  // Фильтруем изображения при нажатии на кнопку
    });
  });

  checkStatusButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getImages" }, response => {
        if (response && response.images) {
          checkStatus(response.images);
        } else {
          //console.error("Не удалось получить данные об изображениях.");
        }
      });
    });
  });

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getImages" }, response => {
      if (response && response.images) {
        cachedImages = response.images; // Сохраняем данные в кэш при загрузке
        updateImageDetails("all", cachedImages);
      } else {
        //console.error("Не удалось получить данные об изображениях.");
      }
    });
  });
});




document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll(".copy-button");
  

  copyButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // Копируем текст
        const textToCopy = targetElement.textContent || targetElement.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
          // Меняем цвет иконки при копировании
          button.classList.add("copied");

          // Возвращаем исходный цвет через 1.5 секунды
          setTimeout(() => {
            button.classList.remove("copied");
          }, 300);
        }).catch(err => {
          //console.error("Ошибка при копировании: ", err);
        });
      }
    });
  });
});

function fetchMetrics() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getMetrics" }, response => {
      if (response) {
        updateMetricStatus("yandex-metrika", response.yandexMetrika);
        updateMetricStatus("google-tag-manager", response.googleTagManager);
        updateMetricStatus("google-analytics", response.googleAnalytics);
        updateMetricStatus("live-internet", response.liveInternet); // Обновляем статус LiveInternet
      } else {
        //console.error("Не удалось получить данные о метриках.");
      }
    });
  });
}

function updateMetricStatus(elementId, data) {
  const element = document.getElementById(elementId);
  const icon = document.createElement("span");
  icon.style.marginLeft = "10px";

  if (data.length) {
    element.textContent = data.join(", ");
    icon.innerHTML = '<i class="fas fa-check-circle" style="color: green;"></i>';
  } else {
    element.textContent = "Не найдено";
    icon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: orange;"></i>';
  }

  element.innerHTML = ""; // Очищаем перед обновлением
  element.appendChild(document.createTextNode(data.length ? data.join(", ") : "Не найдено"));
  element.appendChild(icon);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchMetrics();
});



chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];

  // Отправляем запрос на content.js, чтобы найти CMS
  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    function: findCMS
  }, (results) => {
    if (results && results[0]) {
      const cmsData = results[0].result;
      document.getElementById('cms-data').innerHTML = cmsData || 'Неизвестная CMS';
    }
  });
});

// Функция для поиска CMS, которая будет запускаться в content.js
function findCMS() {
  
const cmsPatterns = {
  "Amiro CMS": [
    "/amiro_sys_css.php?",
    "/amiro_sys_js.php?",
    "-= Amiro.CMS © =-",
    "Работает на Amiro.CMS",
  ],
  Bitrix: ["/bitrix/templates/", "/bitrix/js/", "/bitrix/admin/"],
  "Celena System": [
    "/app/tpl/system/js/celena.js",
    "/app/tpl/system/js",
    "/app/tpl/system/css",
  ],
  "Concrete CMS": ["/concrete/js/", "concrete5 - 5.", "/concrete/css/"],
  Contao: ["This website is powered by Contao Open Source CMS", "tl_files"],
  "CMS Made Simple": ["Released under the GPL - http://cmsmadesimple"],
  "CMS.S3": ["megacounter_key"],
  Craftum: [
    '<meta name="generator" content="Craftum CMS">',
    "<meta name='generator' content='Craftum CMS'>",
    "https://cdn.craftum.com/css/",
  ],
  "Danneo CMS": ["Danneo Русская CMS", 'content="CMS Danneo'],
  "DataLife Engine": [
    "DataLife Engine",
    "/engine/",
    "index.php?do=lostpassword",
    "/engine/ajax/dle_ajax.js",
    "/engine/opensearch.php",
    "/index.php?do=feedback",
    "/index.php?do=rules",
    "/?do=lastcomments",
  ],
  Drupal: [
    "Drupal.settings",
    "misc/drupal.js",
    "drupal_alter_by_ref",
    "/sites/default/files/css/css_",
    "/sites/all/files/css/css_",
  ],
  Ektron: [
    "EktronClientManager",
    "Ektron.PBSettings",
    "ektron.modal.css",
    "Ektron/Ektron.WebForms.js",
    "EktronSiteDataJS",
    "/Workarea/java/ektron.js",
    "Amend the paths to reflect the ektron system",
  ],
  HostCMS: ["/hostcmsfiles/"],
  InSales: [
    "InSales.formatMoney",
    ".html(InSales.formatMoney",
    "Insales.money_format",
  ],
  InstantCMS: ["InstantCMS"],
  "Joomla": [
    "/css/template_css.css",
    "Joomla! 1.5 - Open Source Content Management",
    "/templates/system/css/system.css",
    "Joomla! - the dynamic portal engine and content management system",
    "/media/system/js/caption.js",
    "/templates/system/css/general.css",
  ],
  Kentico: [
    "CMSListMenuLI",
    "CMSListMenuUL",
    "Lvl2CMSListMenuLI",
    "/CMSPages/GetResource.ashx",
  ],
  LiveStreet: ["LIVESTREET_SECURITY_KEY"],
  Magento: ["cms-index-index"],
  "MaxSite CMS": [
    "/application/maxsite/shared/",
    "/application/maxsite/templates/",
    "/application/maxsite/common/",
    "/application/maxsite/plugins/",
  ],
  MODx: [
    "/assets/styles.css",
    "/assets/templates/",
    "/assets/css/lightbox.css",
    "assets/templates/design/",
    "/assets/images/",
    "/assets/components",
  ],
  NetCat: ["/netcat_template/", "/netcat_files/"],
  "OpenCart (ocStore)": [
    "catalog/view/theme/default/stylesheet/stylesheet.css",
    "index.php?route=account/account",
    "index.php?route=account/login",
    "index.php?route=account/simpleregister",
  ],
  phpBB: ["phpBB style name:", "The phpBB Group"],
  PrestaShop: [
    "/themes/PRS",
    "/themes/prestashop/cache/",
    "/themes/prestashop/",
    'meta name="generator" content="PrestaShop"',
  ],
  "Simpla CMS": [
    "design/default/css/main.css",
    "design/default/images/favicon.ico",
    "tooltip='section' section_id=",
  ],
  Shopify: [
    "Shopify.theme",
    "Shopify.routes",
    "/shopifycloud/shopify/",
    "shopify-section",
  ],
  TextPattern: ["/textpattern/index.php"],
  Tilda: ["static.tildacdn.com", "tilda"],
  "TYPO 3": ["This website is powered by TYPO3", "typo3temp/"],
  uCoz: [
    "cms-index-index",
    "U1BFOOTER1Z",
    "U1DRIGHTER1Z",
    "U1CLEFTER1",
    "U1AHEADER1Z",
    "U1TRAKA1Z",
  ],
  "UMI CMS": [
    "umi:element-id=",
    "umi:field-name=",
    "umi:method=",
    "umi:module=",
  ],
  vBulletin: [
    "vbulletin_css",
    "vbulletin_important.css",
    "clientscript/vbulletin_read_marker.js",
    "Powered by vBulletin",
    "Main vBulletin Javascript Initialization",
  ],
  WebAsyst: [
    "/published/SC/",
    "/published/publicdata/",
    "aux_page=",
    "auxpages_navigation",
    "auxpage_",
    "?show_aux_page=",
  ],
  Weebly: [
    "Weebly.Commerce = Weebly.Commerce",
    "Weebly.setup_rpc",
    "editmysite.com/js/site/main.js",
    "editmysite.com/css/sites.css",
    "editmysite.com/editor/libraries",
    "?show_aux_page=",
  ],
  Wix: [
    "X-Wix-Published-Version",
    "X-Wix-Renderer-Server",
    "X-Wix-Meta-Site-Id",
  ],
  WordPress: ["/wp-includes/", "/wp-content/", "/wp-admin/", "/wp-login/"],
};

const cmsLinks = {
  "Amiro CMS": "amiro.ru",
  Bitrix: "1c-bitrix.ru",
  "Celena System": "celena.io",
  "Concrete CMS": "concrete5russia.ru",
  Contao: "contao.org",
  "CMS Made Simple": "cmsmadesimple.ru",
  "CMS.S3": "cms-megagroup.ru",
  Craftum: "craftum.com",
  "Danneo CMS": "danneo.ru",
  "DataLife Engine": "dle-news.ru",
  Drupal: "drupal.org",
  Ektron: "episerver.com/cms/",
  HostCMS: "hostcms.ru",
  InSales: "insales.ru",
  InstantCMS: "instantcms.ru",
  "Joomla!": "joomla.org",
  Kentico: "kentico.com",
  LiveStreet: "livestreet.ru",
  Magento: "magento.com",
  "MaxSite CMS": "max-3000.com",
  MODx: "modx.ru",
  NetCat: "netcat.ru",
  "OpenCart (ocStore)": "opencart.com",
  phpBB: "phpbb.com",
  PrestaShop: "prestashop.com",
  "Simpla CMS": "simplacms.ru",
  Shopify: "shopify.com",
  TextPattern: "textpattern.ru",
  Tilda: "tilda.cc",
  "TYPO 3": "typo3.ru",
  uCoz: "ucoz.ru",
  "UMI CMS": "umi-cms.ru",
  vBulletin: "vbulletin.com",
  WebAsyst: "webasyst.ru",
  Weebly: "weebly.com",
  Wix: "wix.com",
  WordPress: "wordpress.org",
};

  
const html = document.documentElement.innerHTML.toLowerCase(); // Приводим в нижний регистр для более точного поиска
let cmsInfo = "Неизвестная CMS/WYSI/WYG"; // Значение по умолчанию

// Поиск CMS по шаблонам
for (const key in cmsPatterns) {
  if (cmsPatterns.hasOwnProperty(key)) {
    const patterns = cmsPatterns[key];
    for (const pattern of patterns) {
      if (html.includes(pattern.toLowerCase())) { // Сравниваем в нижнем регистре
        cmsInfo = key; // Возвращаем только название CMS
        break;
      }
    }
  }
}

return cmsInfo;
}

// Выполняем функцию поиска CMS, когда попап загружается
document.addEventListener('DOMContentLoaded', function () {
// Сначала показываем "Загрузка..."
document.getElementById('cms-data').textContent = 'Загрузка...';

// После выполнения поиска CMS обновляем текст
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];

  // Отправляем запрос на content.js, чтобы найти CMS
  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    function: findCMS
  }, (results) => {
    if (results && results[0]) {
      const cmsData = results[0].result;
      document.getElementById('cms-data').textContent = cmsData || 'Неизвестная CMS/WYSI/WYG';
    }
  });
});
});

document.addEventListener("DOMContentLoaded", () => {
  const headingsSummary = document.querySelector(".headings-summary");
  const headingsList = document.getElementById("headings-list");
  const structureDisplay = document.getElementById("structure-display");
  const highlightButton = document.getElementById("toggle-highlight-headings");

  if (!highlightButton) {
    //console.error("Кнопка 'toggle-highlight-headings' не найдена в DOM.");
    return;
  }

  // Флаг для отслеживания состояния подсветки
  let isHighlightActive = false;

  // Загружаем сохранённое состояние из chrome.storage при старте
  chrome.storage.sync.get("highlightState", (data) => {
    if (chrome.runtime.lastError) {
      //console.error("Ошибка при получении состояния подсветки:", chrome.runtime.lastError);
      return;
    }

    isHighlightActive = data.highlightState || false;
    updateButtonState();

    // Применяем подсветку на активной вкладке, если она включена
    if (isHighlightActive) {
      toggleHighlightHeadings(true);
    }
  });

  // Общение с содержимым страницы
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      //console.error("Не удалось получить активную вкладку.");
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: extractHeadings,
      },
      (results) => {
        if (chrome.runtime.lastError) {
         //console.error("Ошибка выполнения скрипта:", chrome.runtime.lastError);
          return;
        }

        if (results && results[0] && results[0].result) {
          const { headingsCount, headingsData, headingsStructure } = results[0].result;

          // Обновляем счетчики заголовков
          Object.keys(headingsCount).forEach((key) => {
            const element = document.getElementById(`${key.toLowerCase()}-count`);
            if (element) element.textContent = headingsCount[key];
          });

          // Добавляем общий счет для H1-H6
          const totalCount = Object.values(headingsCount).reduce((sum, count) => sum + count, 0);
          const allCountElement = document.getElementById("all-headings-count");
          if (allCountElement) allCountElement.textContent = totalCount;

          // Сохраняем данные
          window.headingsData = headingsData;
          window.headingsStructure = headingsStructure;
        } else {
          //console.error("Не удалось извлечь данные заголовков.");
        }
      }
    );
  });

  // Отображение заголовков
  function renderHeadings(type) {
    if (!window.headingsData) {
      //console.error("Нет данных для отображения заголовков.");
      return;
    }

    const filtered = type === "all" ? window.headingsData : window.headingsData.filter((h) => h.tagName === type);
    headingsList.innerHTML = filtered
      .map((h) => `<li><b>${h.tagName}:</b> ${h.text}</li>`)
      .join("");
    structureDisplay.innerHTML = ""; // Очистка структуры
  }

  // Отображение структуры заголовков
  function renderStructure() {
    if (!window.headingsStructure) {
      //console.error("Нет данных для отображения структуры заголовков.");
      return;
    }

    structureDisplay.innerHTML = window.headingsStructure
      .map(
        (h) =>
          `<div style="margin-left: ${
            h.tagName === "H2"
              ? "10px"
              : h.tagName === "H3"
              ? "20px"
              : h.tagName === "H4"
              ? "30px"
              : "0"
          };"><b>${h.tagName}:</b> ${h.text}</div>`
      )
      .join("");
    headingsList.innerHTML = ""; // Очистка списка
  }

  // Обработчик кликов по блокам
  if (headingsSummary) {
    headingsSummary.addEventListener("click", (e) => {
      const headingType = e.target.closest(".heading-count")?.dataset.heading;
      if (headingType) {
        if (headingType === "all") {
          renderStructure(); // Показать всю структуру заголовков
        } else {
          renderHeadings(headingType); // Показать заголовки конкретного типа
        }
      }
    });
  } else {
    //console.error("Элемент 'headings-summary' не найден в DOM.");
  }

  // Функция для подсветки заголовков
  function toggleHighlightHeadings(isActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        //console.error("Не удалось получить активную вкладку для подсветки.");
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: (active) => {
            const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
            headings.forEach((heading) => {
              if (active) {
                heading.style.backgroundColor = "#8e8e8e";

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
          },
          args: [isActive],
        },
        () => {
          if (chrome.runtime.lastError) {
            //console.error("Ошибка выполнения подсветки заголовков:", chrome.runtime.lastError);
          } else {
            //console.log(`Подсветка заголовков ${isActive ? "включена" : "выключена"}.`);
          }
        }
      );
    });
  }

  // Функция для обновления текста на кнопке
  function updateButtonState() {
    highlightButton.textContent = isHighlightActive ? "Выключить подсветку H1-H6" : "Включить подсветку H1-H6";
  }

  // Кнопка подсветки
  highlightButton.addEventListener("click", () => {
    isHighlightActive = !isHighlightActive;
    chrome.storage.sync.set({ highlightState: isHighlightActive }, () => {
      if (chrome.runtime.lastError) {
        //console.error("Ошибка сохранения состояния подсветки:", chrome.runtime.lastError);
      } else {
        //console.log("Состояние подсветки сохранено:", isHighlightActive);
      }
    });

    // Отправляем сообщение в content.js для применения состояния подсветки
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_HIGHLIGHT", isActive: isHighlightActive });
      }
    });

    updateButtonState();
  });

  // Функция для извлечения заголовков (выполняется на странице)
  function extractHeadings() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    const headingsCount = { H1: 0, H2: 0, H3: 0, H4: 0, H5: 0, H6: 0 };

    const headingsData = headings.map((heading) => {
      const tagName = heading.tagName;
      headingsCount[tagName]++;
      return { tagName, text: heading.textContent.trim() };
    });

    const headingsStructure = headings.map((heading) => ({
      tagName: heading.tagName,
      text: heading.textContent.trim(),
    }));

    return { headingsCount, headingsData, headingsStructure };
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-buttons");
  const wordList = document.getElementById("word-list");
  const wordSearch = document.getElementById("word-search");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const exportButton = document.getElementById("export-button");

  const textLengthEl = document.getElementById("text-length");
  const cleanTextLengthEl = document.getElementById("clean-text-length");
  const textWaterinessEl = document.getElementById("text-wateriness");
  const textSpamminessEl = document.getElementById("text-spamminess");

  let wordData = {
    oneWord: [],
    twoWords: [],
    threeWords: [],
    linkWords: [],
  };
  let currentTab = "oneWord"; // По умолчанию "1 слово"
  let filteredData = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  // Переключение вкладок
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.dataset.tab;

      // Сброс страницы и поиска при переключении вкладки
      wordSearch.value = "";
      currentPage = 1;
      updateTableData();
    });
  });

  // Установка активной вкладки "1 слово" при загрузке
  document.querySelector('[data-tab="oneWord"]').classList.add("active");

  // Обновление таблицы
  function updateTableData() {
    filteredData = [...wordData[currentTab]]; // Копия данных
    renderPage();
  }

  // Рендер одной страницы
  function renderPage() {
    filteredData.sort((a, b) => b.count - a.count); // Сортировка по количеству слов
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    wordList.innerHTML = pageData
      .map(
        (item, index) => `
        <tr>
          <td>${startIndex + index + 1}</td>
          <td>${item.word}</td>
          <td>${item.count}</td>
        </tr>`
      )
      .join("");

    // Обновление информации о пагинации
    pageInfo.textContent = `Страница ${currentPage} из ${Math.ceil(filteredData.length / rowsPerPage)}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === Math.ceil(filteredData.length / rowsPerPage);
  }

  // Поиск
  wordSearch.addEventListener("input", (e) => {
    const filter = e.target.value.toLowerCase();
    filteredData = wordData[currentTab].filter((item) => item.word.toLowerCase().includes(filter));
    currentPage = 1; // Сброс на первую страницу при фильтрации
    renderPage();
  });

  // Пагинация
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
      currentPage++;
      renderPage();
    }
  });

  exportButton.addEventListener("click", () => {
    // Заголовки CSV
    const csvHeader = ["#", "Слово", "Количество"];
    // Формируем данные таблицы для экспорта
    const csvRows = filteredData.map(
      (item, index) => `${index + 1};${item.word};${item.count}`
    );
    // Объединяем заголовки и строки данных
    const csvContent = [csvHeader.join(";"), ...csvRows].join("\n");
  
    // Добавляем BOM в начале файла для корректного отображения UTF-8
    const bom = "\uFEFF"; // BOM для UTF-8
    const csvWithBom = bom + csvContent;
  
    // Создаем объект URL для CSV
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    // Создаем ссылку для скачивания
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "word_analysis.csv");
    document.body.appendChild(link);
  
    // Имитируем клик для загрузки файла
    link.click();
  
    // Очищаем ссылку после скачивания
    document.body.removeChild(link);
  });
  



  // Запрос данных с текущей страницы
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: analyzeText, // Функция для анализа текста
      },
      (results) => {
        const {
          textLength,
          cleanTextLength,
          wateriness,
          spamminess,
          oneWord,
          twoWords,
          threeWords,
          linkWords,
        } = results[0].result;

        // Заполнение данных блока text-info
        textLengthEl.textContent = textLength;
        cleanTextLengthEl.textContent = cleanTextLength;
        textWaterinessEl.textContent = `${wateriness}%`;
        textSpamminessEl.textContent = `${spamminess}%`;

        // Заполнение данных по вкладкам
        wordData.oneWord = oneWord;
        wordData.twoWords = twoWords;
        wordData.threeWords = threeWords;
        wordData.linkWords = linkWords;

        updateTableData();
      }
    );
  });
});

// Функция анализа текста
function analyzeText() {
  const text = document.body.innerText;
  const words = text.split(/\s+/);
  const cleanTextLength = text.replace(/\s+/g, "").length;
  const totalLength = text.length;

  function calculateWateriness() {
    const stopWords = ["и", "в", "на", "с", "по", "а"];  // Пример стоп-слов
    const cleanWords = words
      .map(word => word.replace(/[^\wа-яА-Я]/g, '').toLowerCase())  // Убираем все неалфавитные символы и приводим к нижнему регистру
      .filter(word => word.length > 0);  // Убираем пустые строки
  
  
    // Проверяем, сколько из слов являются стоп-словами
    const waterWordsCount = cleanWords.filter(word => stopWords.includes(word)).length;
  
  
  
    // Если нет ни одного слова, то возвращаем 0%
    if (cleanWords.length === 0) {
      return 0;
    }
  
    // Рассчитываем процент водянистых слов
    const waterinessPercentage = ((waterWordsCount / cleanWords.length) * 100).toFixed(2);
  
  
    return waterinessPercentage;
  }
  

  function calculateSpamminess(word, count) {
    return ((count / words.length) * 100).toFixed(2);
  }

  function countPhrases(arr, n) {
    const phrases = {};
    for (let i = 0; i < arr.length - n + 1; i++) {
      const phrase = arr.slice(i, i + n).join(" ");
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
    return Object.entries(phrases).map(([word, count]) => ({
      word,
      count,
    }));
  }

  return {
    textLength: totalLength,
    cleanTextLength,
    wateriness: calculateWateriness(),
    spamminess: calculateSpamminess(words.join(" "), words.length),
    oneWord: countPhrases(words, 1),
    twoWords: countPhrases(words, 2),
    threeWords: countPhrases(words, 3),
    linkWords: countPhrases(Array.from(document.querySelectorAll("a")).map((a) => a.innerText), 1),
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const canonicalResult = document.getElementById("canonical-result");
  const metaRobotsResult = document.getElementById("meta-robots-result");
  const robotsResult = document.getElementById("robots-result");
  const sitemapResult = document.getElementById("sitemap-result");

  try {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const tab = tabs[0];
          if (!tab || !tab.url) {
              throw new Error("Не удалось получить текущую вкладку.");
          }

        
            // Используем chrome.scripting.executeScript
            const [injectionResult] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => document.documentElement.outerHTML,
          });

          const html = injectionResult.result;
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");

          // 1. Проверка каноничного адреса
          checkCanonical(doc, tab.url, canonicalResult);

          // 2. Проверка Meta Robots
          checkMetaRobots(doc, metaRobotsResult);

          // 3. Проверка robots.txt
          await checkRobotsTxt(tab.url, robotsResult);

          // 4. Проверка sitemap.xml
          await checkSitemap(tab.url, sitemapResult);
      });
  } catch (error) {
      //console.error("Ошибка выполнения: ", error);
  }
});

// Проверка каноничного адреса
function checkCanonical(doc, currentUrl, container) {
  const canonicalElement = doc.querySelector('link[rel="canonical"]');

  if (canonicalElement) {
      const canonicalHref = canonicalElement.getAttribute('href');

      // Проверяем, является ли адрес относительным
      const isRelative = !canonicalHref.startsWith('http://') && !canonicalHref.startsWith('https://');

      // Нормализуем текущий URL и канонический URL для корректного сравнения
      const normalizeUrl = (url) => {
          return url
              .trim()
              .toLowerCase()
              .replace(/\/$/, ''); // Убираем конечный слэш
      };

      const normalizedCurrentUrl = normalizeUrl(currentUrl);
      const normalizedCanonicalHref = normalizeUrl(canonicalHref);

      if (isRelative) {
          container.innerHTML = `
              <span class="fa fa-times-circle" style="color:red;"></span>
              Содержимое тега указано некорректно, но индексирование страницы не запрещено: <span>href="${canonicalHref}"</span>
          `;
      } else if (normalizedCanonicalHref === normalizedCurrentUrl) {
          container.innerHTML = `
              <span class="fas fa-check-circle" style="color: green;"></span>
              Каноничной страницей является текущая страница: <a href="${canonicalHref}" target="_blank">${canonicalHref}</a>
          `;
      } else {
          container.innerHTML = `
              <span class="fas fa-exclamation-circle" style="color: orange;"></span>
              Каноничной является другая страница: <a href="${canonicalHref}" target="_blank">${canonicalHref}</a>
          `;
      }
  } else {
      container.innerHTML = `
          <span class="fas fa-check-circle" style="color: green;"></span>
          Каноничный адрес не указан (Индексация разрешена)
      `;
  }
}


// Проверка Meta Robots
function checkMetaRobots(doc, container) {
  const metaElement = doc.querySelector('meta[name="robots"]');

  if (metaElement) {
      const content = metaElement.content.toLowerCase(); // Приводим содержимое к нижнему регистру для удобства проверки

      if (content.includes("noindex")) {
          container.innerHTML = `
              <span class="fa fa-times-circle" style="color:red;"></span>
              Индексация страницы запрещена: ${content}
          `;
      } else if (content.includes("index") || content.includes("follow")) {
          container.innerHTML = `
              <span class="fas fa-check-circle" style="color: green;"></span>
              Индексация страницы разрешена: ${content}
          `;
      } else {
          container.innerHTML = `
              <span class="fas fa-exclamation-circle" style="color: orange;"></span>
              Индексация разрешена, но Meta Robots содержит нестандартные значения: ${content}
          `;
      }
  } else {
      container.innerHTML = `
          <span class="fas fa-check-circle" style="color: green;"></span>
          Meta Robots не указан (Индексация разрешена)
      `;
  }
}

// Проверка robots.txt
async function checkRobotsTxt(tabUrl, container) {
  const robotsUrl = new URL("/robots.txt", tabUrl).href;

  try {
      const response = await fetch(robotsUrl, {
          headers: {
              "User-Agent": "Mozilla/5.0 (compatible; MyBot/1.0; +http://example.com/bot)",
              "Cache-Control": "no-cache"
          }
      });

      if (response.status === 404) {
          container.innerHTML = `<p><span class="fa fa-times-circle" style="color:red;"></span> Файл Robots.txt отсутствует</p>`;
          return;
      }

      if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const robotsText = await response.text();

      if (robotsText.trim() === "") {
          container.innerHTML = `<p><span class="fa fa-exclamation-circle" style="color:orange;"></span> Файл Robots.txt пуст (Индексация разрешена)</p>`;
          return;
      }

      const lines = robotsText.split("\n");
      const userAgents = [];
      let currentAgent = null;

      // Сбор всех User-Agent и их правил
      lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith("user-agent:")) {
              currentAgent = trimmed.split(":")[1].trim().toLowerCase();
              userAgents.push({ agent: currentAgent, rules: [] });
          } else if (
              currentAgent &&
              (trimmed.toLowerCase().startsWith("disallow:") ||
                  trimmed.toLowerCase().startsWith("allow:"))
          ) {
              const rule = trimmed.split(":")[1].trim();
              userAgents[userAgents.length - 1].rules.push({
                  type: trimmed.toLowerCase().startsWith("disallow:") ? "Disallow" : "Allow",
                  path: rule || "",
                  original: trimmed,
              });
          }
      });

      // Применение правил следующим User-Agent, если правила пустые
      for (let i = userAgents.length - 1; i >= 0; i--) {
          if (userAgents[i].rules.length === 0 && i < userAgents.length - 1) {
              userAgents[i].rules = userAgents[i + 1].rules;
          }
      }

      const convertRobotsTxtToRegex = (robotsTxtPattern) => {
          const regexPattern = robotsTxtPattern
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
              .replace(/\\\*/g, ".*")
              .replace(/\\\$/g, "$");
          return new RegExp(`^${regexPattern}`);
      };

      const checkPathAgainstRobotsRegex = (pattern, path) => {
          return convertRobotsTxtToRegex(pattern).test(path);
      };

      const isPathAllowed = (rules, path) => {
          let allowed = true;
          let ruleMatched = null;

          rules.forEach(({ type, path: rulePath, original }) => {
              if (type === "Disallow" && rulePath === "") {
                  return;
              }
              if (checkPathAgainstRobotsRegex(rulePath, path)) {
                  allowed = type === "Allow";
                  ruleMatched = original;
              }
          });

          return { allowed, ruleMatched };
      };

      let htmlContent = `<p>Файл Robots.txt: <a href="${robotsUrl}" target="_blank">${robotsUrl}</a></p>`;
      htmlContent += "<p>Список User-Agent и их статус:</p>";
      htmlContent += "<ul>";

      const currentPath = new URL(tabUrl).pathname + new URL(tabUrl).search;

      for (const { agent, rules } of userAgents) {
          const { allowed, ruleMatched } = isPathAllowed(rules, currentPath);
          htmlContent += `<li>User-Agent: ${agent} 
              <span class="${allowed ? 'fas fa-check-circle' : 'fa fa-times-circle'}" 
              style="color: ${allowed ? 'green' : 'red'};"></span> 
              ${allowed ? "Разрешено" : `Запрещено правилом: <code>${ruleMatched}</code>`}</li>`;
      }

      htmlContent += "</ul>";
      container.innerHTML = htmlContent;
  } catch (error) {
      container.innerHTML = `<p><span class="fas fa-exclamation-circle" style="color: orange;"></span> Не удалось загрузить файл Robots.txt<p>Проверьте файл вручную: <a href="${robotsUrl}" target="_blank">${robotsUrl}</a></p></p>`;
  }
}


// Проверка sitemap.xml
async function checkSitemap(tabUrl, container) {
  // Формируем URL для robots.txt
  const robotsUrl = new URL("/robots.txt", tabUrl).href;

  let resultHtml = "";
  let sitemapsFound = false;

  try {
    const robotsResponse = await fetch(robotsUrl);
    if (!robotsResponse.ok) {
      throw new Error("Robots.txt не найден");
    }

    // Получаем текст из robots.txt
    const robotsText = await robotsResponse.text();

    // Ищем все строки, начинающиеся с "Sitemap:"
    const sitemapUrls = [];
    const sitemapRegex = /sitemap:\s*(https?:\/\/[^\s]+)/gi;
    let match;
    while ((match = sitemapRegex.exec(robotsText)) !== null) {
      sitemapUrls.push(match[1]); // Добавляем каждый найденный sitemap URL в список
    }

    // Если нет найденных sitemap, проверяем стандартный путь /sitemap.xml
    if (sitemapUrls.length === 0) {
      const defaultSitemapUrl = new URL("/sitemap.xml", tabUrl).href;
      try {
        const defaultResponse = await fetch(defaultSitemapUrl);
        if (defaultResponse.status === 200) {
          resultHtml += `<div><span class=\"fas fa-check-circle\" style=\"color: green;\"></span> Доступен: <a href=\"${defaultSitemapUrl}\" target=\"_blank\">${defaultSitemapUrl}</a></div>`;
          sitemapsFound = true;
        } else {
          resultHtml += `<div><span class=\"fas fa-times-circle\" style=\"color: red;\"></span> Файл Sitemap.xml отсутствует</div>`;
        }
      } catch (error) {
        resultHtml += `<div><span class=\"fas fa-times-circle\" style=\"color: red;\"></span> Файл Sitemap.xml отсутствует</div>`;
      }
    } else {
      // Проверяем доступность каждого найденного sitemap
      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await fetch(sitemapUrl);
          if (response.status === 200) {
            resultHtml += `<div><span class=\"fas fa-check-circle\" style=\"color: green;\"></span> Доступен: <a href=\"${sitemapUrl}\" target=\"_blank\">${sitemapUrl}</a></div>`;
            sitemapsFound = true;
          } else if (response.status === 404) {
            resultHtml += `<div><span class=\"fas fa-times-circle\" style=\"color: red;\"></span> Недоступен: <a href=\"${sitemapUrl}\" target=\"_blank\">${sitemapUrl}</a></div>`;
          } else {
            resultHtml += `<div><span class=\"fas fa-exclamation-circle\" style=\"color: orange;\"></span> Неожиданный ответ (${response.status}): <a href=\"${sitemapUrl}\" target=\"_blank\"> ${sitemapUrl}</a></div>`;
          }
        } catch (error) {
          resultHtml += `<div><span class=\"fas fa-times-circle\" style=\"color: red;\"></span> Не удалось проверить: <a href=\"${sitemapUrl}\" target=\"_blank\"> ${sitemapUrl}</a></div>`;
        }
      }
    }
  } catch (error) {
    // Если robots.txt недоступен, проверяем стандартный путь /sitemap.xml
    const defaultSitemapUrl = new URL("/sitemap.xml", tabUrl).href;
    try {
      const defaultResponse = await fetch(defaultSitemapUrl);
      if (defaultResponse.status === 200) {
        resultHtml += `<div><span class=\"fas fa-check-circle\" style=\"color: green;\"></span> Доступен: <a href=\"${defaultSitemapUrl}\" target=\"_blank\">${defaultSitemapUrl}</a></div>`;
        sitemapsFound = true;
      } else {
        resultHtml += `<div><span class=\"fas fa-times-circle\" style=\"color: red;\"></span> Файл Sitemap.xml отсутствует</div>`;
      }
    } catch (innerError) {
      resultHtml += `<div><span class=\"fas fa-times-circle\" style=\"color: red;\"></span> Файл Sitemap.xml отсутствует</div>`;
    }
  }

  // Если файлы найдены, добавляем заголовок
  if (sitemapsFound) {
    resultHtml = `Список Sitemap.xml и их статус:<br><br>` + resultHtml;
  }

  // Если ничего не найдено и файл по умолчанию недоступен
  if (!resultHtml) {
    resultHtml = `<span class=\"fa fa-times-circle\" style=\"color:red;\"></span> Файл Sitemap.xml отсутствует`;
  }

  // Обновляем контейнер с результатами
  container.innerHTML = resultHtml;
}


document.addEventListener('DOMContentLoaded', function () {
  // Функция для проверки HTTP-заголовков
  function checkRobotsTag() {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const tab = tabs[0];
          const url = tab.url;

          // Меняем статус на "Загрузка"
          document.getElementById('meta-x-Robots-Tag-result').classList.add('loading');
          document.getElementById('meta-x-Robots-Tag-result').textContent = 'Загрузка...';

          fetch(url)
              .then(response => {
                  // Получаем заголовки X-Robots-Tag
                  const xRobotsTag = response.headers.get('X-Robots-Tag');
                  if (xRobotsTag) {
                      // Ищем директивы
                      const directives = ['noindex', 'nofollow', 'none', 'noarchive'];
                      let found = false;
                      let statusText = '';
                      let statusClass = '';
                      let icon = '';

                      directives.forEach(directive => {
                          if (xRobotsTag.toLowerCase().includes(directive)) {
                              found = true;
                              statusText = `Обнаружен заголовок X-Robots-Tag с директивой: ${directive}.`;
                              icon = '<span class="fa fa-times-circle" style="color: red;"></span>';  // Красный крестик
                              statusClass = 'error';
                              // Объяснение каждой директивы
                              let explanation = '';
                              switch (directive) {
                                  case 'noindex':
                                      explanation = 'Этот сайт не должен индексироваться в поисковых системах';
                                      break;
                                  case 'nofollow':
                                      explanation = 'Ссылки на этом сайте не должны быть проиндексированы';
                                      break;
                                  case 'none':
                                      explanation = 'Этот сайт не должен индексироваться и не следует следовать за ссылками';
                                      break;
                                  case 'noarchive':
                                      explanation = 'Поисковая система не должна сохранять кэш этого сайта';
                                      break;
                              }
                              statusText += '\n' + explanation;
                          }
                      });

                      if (!found) {
                          statusText = 'Заголовок X-Robots-Tag не содержит нежелательных директив (Индексация разрешена)';
                          icon = '<span class="fas fa-check-circle" style="color: green;"></span>';  // Зеленая галочка
                          statusClass = 'success';
                      }

                      // Обновляем DOM с результатом
                      document.getElementById('meta-x-Robots-Tag-result').innerHTML = `${icon} <span style="color: gray;">${statusText}</span>`;
                      document.getElementById('meta-x-Robots-Tag-result').classList.remove('loading');
                      document.getElementById('meta-x-Robots-Tag-result').classList.add(statusClass);
                  } else {
                      // Если заголовок не найден, считаем, что все в порядке
                      document.getElementById('meta-x-Robots-Tag-result').innerHTML = '<span class="fas fa-check-circle" style="color: green;"></span> <span style="color: gray;">Заголовок X-Robots-Tag не найден (Индексация разрешена)</span>';
                      document.getElementById('meta-x-Robots-Tag-result').classList.remove('loading');
                      document.getElementById('meta-x-Robots-Tag-result').classList.add('success');
                  }
              })
              .catch(error => {
                  //console.error('Ошибка при получении заголовков:', error);
                  document.getElementById('meta-x-Robots-Tag-result').textContent = 'Ошибка при запросе сайта';
                  document.getElementById('meta-x-Robots-Tag-result').classList.remove('loading');
                  document.getElementById('meta-x-Robots-Tag-result').classList.add('error');
              });
      });
  }

  // Запуск проверки при загрузке popup
  checkRobotsTag();
});




// Функция для обновления URL и количества символов
function updateUrl() {
  // Проверяем, если это расширение, то получаем URL текущей страницы
  let currentUrl = window.location.href;
  
  // Проверяем, если это расширение (chrome-extension), то показываем URL страницы
  if (currentUrl.startsWith('chrome-extension://')) {
    // Получаем URL активной страницы через API
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var pageUrl = tabs[0].url;
      var urlLength = pageUrl.length; // Получаем длину URL страницы

      // Обновляем содержимое элементов на странице
      document.getElementById('current-url').textContent = pageUrl;
      document.getElementById('url-length').textContent = `Символов: ` + urlLength;
    });
  } else {
    var urlLength = currentUrl.length;
    document.getElementById('current-url').textContent = currentUrl;
    document.getElementById('url-length').textContent = `Символов: ` + urlLength;
  }
}

// Обновляем данные при загрузке страницы
window.onload = function() {
  updateUrl();
};

// Также можно обновлять информацию при изменении URL (например, при навигации по страницам)
window.onpopstate = function() {
  updateUrl();
};

// Функция для перезагрузки страницы с обходом кеша
function reloadPageWithCacheClear() {
  // Используем chrome.tabs API для перезагрузки текущей вкладки
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    // Перезагружаем вкладку с флагом bypassCache
    chrome.tabs.reload(tabs[0].id, { bypassCache: true });
  });
}

// Обработчик нажатия на кнопку
document.getElementById('reload-btn').addEventListener('click', function() {
  reloadPageWithCacheClear();
});

// Обновляем данные при загрузке страницы
window.onload = function() {
  updateUrl();
};

// Обновляем информацию при изменении URL (например, при навигации по страницам)
window.onpopstate = function() {
  updateUrl();
};

document.addEventListener('DOMContentLoaded', function() {
  // Получаем активную вкладку
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const domain = new URL(tabs[0].url).hostname;

      // Формируем URL для получения ИКС (с уникальным параметром для предотвращения кеширования)
      const imgUrl = `https://yandex.ru/cycounter?theme=light&host=${domain}&t=${new Date().getTime()}`;

      // Находим элементы DOM
      const iksImage = document.getElementById('iksImage');
      const iksText = document.getElementById('yandex-iks');
      const loadingMessage = document.getElementById('loadingMessage');

      // Скрываем текст "Загрузка..." и пробуем показать картинку
      iksImage.style.display = 'none';
      loadingMessage.style.display = 'block';

      // Пробуем загрузить картинку с ИКС
      iksImage.src = imgUrl;

      iksImage.onload = function() {
          // Если картинка загружена, показываем её
          iksImage.style.display = 'block';
          loadingMessage.style.display = 'none';
      };

      iksImage.onerror = function() {
          // Если картинка не загружается, выводим сообщение об ошибке
          iksText.textContent = 'ИКС не найден';
          loadingMessage.style.display = 'none';
      };
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const pageSizeElement = document.getElementById("page-size");
  const responseCodeElement = document.getElementById("response-code");
  const timeCodeElement = document.getElementById("time-code"); // Элемент для времени

  // Получение текущей активной вкладки
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    const url = tab.url;  // Получаем полный URL страницы

    // Отправка запроса на полный URL для размера страницы
    fetch(url)
      .then(response => {
        // Получаем размер страницы
        return response.text().then(text => {
          const sizeInBytes = new Blob([text]).size;
          const sizeInKB = (sizeInBytes / 1024).toFixed(2);
          pageSizeElement.textContent = `${sizeInKB} КБ`;
        });
      })
      .catch(() => {
        pageSizeElement.textContent = "Ошибка";
      });

    // Замер времени ответа сервера
    const startTime = Date.now(); // Засекаем время перед запросом

    // Отправка запроса для получения кода статуса HTTP напрямую
    fetch(url)
      .then(response => {

        // Выводим код ответа в UI
        responseCodeElement.textContent = response.status; // Код ответа сервера

        // Замер времени после получения ответа
        const endTime = Date.now(); 
        const responseTime = endTime - startTime; // Время ответа в мс

        // Выводим время ответа в UI
        timeCodeElement.textContent = `${responseTime} мс`; 
      })
      .catch(error => {
        //console.error(error);
        responseCodeElement.textContent = "Ошибка";
        timeCodeElement.textContent = "Ошибка"; // Если ошибка, то выводим ошибку
      });
  });
});

function fetchSslInfoAndUpdatePopup() {
  let hostname = null;

  // Получаем домен текущей страницы с помощью API Chrome
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const origin = tabs[0].url;
      const host = new URL(origin).hostname;
      hostname = host;

      //console.log("Current hostname: ", hostname); // Лог для проверки текущего домена

      // Формируем URL для запроса к API
      const url = `https://majento.ru/pages/seo-analize/read-ssl/search.php?url=${origin}`;
      //console.log("API URL: ", url); // Лог для проверки URL

      // Выполняем запрос на API
      fetch(url)
        .then((response) => {
          //console.log("Response status: ", response.status); // Лог статуса ответа

          if (!response.ok) {
            throw new Error(`Ошибка запроса: ${response.statusText}`);
          }

          return response.json();  // Парсим ответ как JSON
        })
        .then((data) => {
          //console.log("API response (JSON): ", data); // Лог для проверки JSON-ответа

          // Извлекаем HTML-контент из JSON-ответа
          const html = data.json.ssl;

          // Создаем временный элемент для парсинга HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Ищем все строки таблицы
          const rows = doc.querySelectorAll('table tr');

          let sslExpiryDate = null;

          // Перебираем все строки таблицы
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');

            if (cells.length > 1) {
              // Проверяем, что первая ячейка содержит "Valid To"
              const parameter = cells[0].textContent.trim();
              if (parameter === 'Valid To') {
                // Ищем вложенный div с датой
                const dateDiv = cells[1].querySelector('div');
                if (dateDiv) {
                  sslExpiryDate = dateDiv.textContent.trim();  // Извлекаем дату из div
                }
              }
            }
          });

          if (sslExpiryDate) {
            //console.log("SSL Expiry Date: ", sslExpiryDate); // Лог для проверки даты
            document.getElementById("ssl-expiry-date").textContent = sslExpiryDate;
          } else {
            document.getElementById("ssl-expiry-date").textContent = "Дата не найдена";
          }
        })
        .catch((error) => {
          //console.error("Ошибка при получении данных о SSL:", error);
          document.getElementById("ssl-expiry-date").textContent = `Ошибка: ${error.message}`;
        });
    } else {
      //console.error("Не удалось получить информацию о текущей вкладке");
      document.getElementById("ssl-expiry-date").textContent = "Ошибка при получении данных";
    }
  });
}

// Запускаем функцию после загрузки контента страницы
document.addEventListener("DOMContentLoaded", fetchSslInfoAndUpdatePopup);
// Функция для форматирования даты
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

// Функция для получения возраста домена
function getAge(createdDate, currentDate) {
  const ageInMilliseconds = currentDate - createdDate;
  const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));

  const years = Math.floor(ageInDays / 365); // Возраст в годах
  const days = ageInDays % 365; // Остаток дней
  return { years, days }; // Возвращаем объект с годами и днями
}

// Пример функции для перевода
function translate(key) {
  const translations = {
    "domainAgeYears": "лет",
    "domainAgeDays": "дней"
  };
  return translations[key] || key;
}


// Функция для получения данных с API
async function loadDomainData(domain) {
  const url = `https://api.whois.vu/?q=${domain}`;

  try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.created) {
          const created = new Date(data.created * 1000); // Преобразуем в дату
          // Отображение даты регистрации
          document.getElementById("domain-registration-date").textContent = formatDate(created);

          // Отображение возраста домена
const age = getAge(created, new Date());
document.getElementById("domain-age").innerHTML = 
    `${age.years} <span data-translation="domainAgeAge">${translate("domainAgeYears")}</span> и ${age.days} ${translate("domainAgeDays")}`;

      } else {
          document.getElementById("domain-registration-date").textContent = "Информация не доступна";
          document.getElementById("domain-age").textContent = "Информация не доступна";
      }
  } catch (error) {
      //console.error('Ошибка при получении данных:', error);
      document.getElementById("domain-registration-date").textContent = "Ошибка загрузки";
      document.getElementById("domain-age").textContent = "Ошибка загрузки";
  }
}

// Функция для получения текущего домена с активной вкладки
function getCurrentDomain() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      const origin = tabs[0].url;
      const host = new URL(origin).hostname;
      loadDomainData(host); // Загружаем данные по домену текущей вкладки
    } else {
      //console.log('Не удалось получить URL текущей вкладки');
    }
  });
}

// Вызов функции после загрузки страницы
document.addEventListener("DOMContentLoaded", function() {
  getCurrentDomain(); // Получаем текущий домен и загружаем его данные
});


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url) {
    // Получаем URL текущей страницы
    const origin = tabs[0].url;
    
    // Извлекаем домен с помощью URL API
    const host = new URL(origin).hostname;

    // Запрашиваем информацию о домене через IP API
    fetch(`http://ip-api.com/json/${host}`)
      .then((response) => response.json())
      .then((data) => {
        const { status, query: ip, country } = data;

        if (status === "fail") {
          throw new Error("Не удалось получить данные о IP");
        }

        // Обновляем элемент в таблице с IP-адресом
        const ipAddressElement = document.querySelector("#site-ip");
        ipAddressElement.innerHTML = `<span id="ip-address-link">${ip}</span> (${country})`;

        // Добавляем обработчик клика на ссылку с IP-адресом
        const ipAddressButton = document.querySelector("#ip-address-link");
        ipAddressButton.onclick = () => {
          document.dispatchEvent(new CustomEvent("ShowModalWithIpMatches"));
        };
      })
      .catch(() => {
        // Обрабатываем ошибку в случае неудачного запроса
        const ipAddressElement = document.querySelector("#site-ip");
        ipAddressElement.innerHTML = "Ошибка получения IP";
      });
  }
});


document.addEventListener("DOMContentLoaded", function() {
  // Находим все заголовки секций
  const sectionTitles = document.querySelectorAll('.section-title');

  sectionTitles.forEach(function(title) {
      title.addEventListener('click', function() {
          // Находим родительский <ul> для текущего заголовка
          let list = title.closest('ul');
          
          // Если <ul> найден, то переключаем видимость элементов <li>
          if (list) {
              const listItems = list.querySelectorAll('li');
              listItems.forEach(function(item) {
                  item.style.display = (item.style.display === 'none' || item.style.display === '') ? 'block' : 'none';
              });
          }
      });
  });
});

let jsEnabled = true; // Состояние JavaScript (по умолчанию включено)

// Загружаем сохраненное состояние при загрузке попапа
chrome.storage.local.get(['jsEnabled'], function (result) {
  jsEnabled = result.jsEnabled !== undefined ? result.jsEnabled : true;
  updateButtonState("toggle-js", jsEnabled);
});

// Обработчик для кнопки отключения/включения JavaScript
document.getElementById("toggle-js").addEventListener("click", () => {
  jsEnabled = !jsEnabled;
  updateButtonState("toggle-js", jsEnabled);

  // Сохраняем состояние
  chrome.storage.local.set({ jsEnabled });

  // Отправляем сообщение для переключения JavaScript
  chrome.runtime.sendMessage({ action: 'toggleJavaScript', jsEnabled });
});

// Функция для обновления состояния кнопки
function updateButtonState(buttonId, isActive) {
  const button = document.getElementById(buttonId);
  const icon = button.querySelector("i");

  if (isActive) {
    button.classList.add("active");
    icon.classList.remove("fa-toggle-off");
    icon.classList.add("fa-toggle-on");
  } else {
    button.classList.remove("active");
    icon.classList.remove("fa-toggle-on");
    icon.classList.add("fa-toggle-off");
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  const executeScriptInActiveTab = (script) => {
      return new Promise((resolve, reject) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (!tabs || tabs.length === 0) {
                  reject("Нет активной вкладки.");
                  return;
              }
              chrome.scripting.executeScript(
                  {
                      target: { tabId: tabs[0].id },
                      func: script,
                  },
                  (results) => {
                      if (chrome.runtime.lastError) {
                          reject(chrome.runtime.lastError.message);
                      } else {
                          resolve(results[0]?.result);
                      }
                  }
              );
          });
      });
  };

  const updateCharset = async () => {
      const charset = await executeScriptInActiveTab(() => document.characterSet || document.charset);
      document.getElementById("charset").textContent = charset || "Не удалось определить";
  };

  const updateHreflang = async () => {
      const hreflangs = await executeScriptInActiveTab(() => {
          return Array.from(document.querySelectorAll('link[rel="alternate"]'))
              .map(link => link.getAttribute("hreflang"))
              .filter(Boolean)
              .join(", ");
      });
      document.getElementById("hreflang").textContent = hreflangs || "Отсутствует";
  };


  try {
      await updateCharset();
      await updateHreflang();
  } catch (error) {
      //console.error("Ошибка при выполнении скрипта:", error);
  }
});


document.addEventListener('DOMContentLoaded', () => {
  // Функция для копирования текста
  function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      // Меняем цвет иконки при копировании
      button.classList.add("copied");

      // Возвращаем исходный цвет через 1.5 секунды
      setTimeout(() => {
        button.classList.remove("copied");
      }, 300);
    }).catch(err => {
      //console.error("Ошибка при копировании: ", err);
    });
  }

  // Обработчик для кнопки с allmeta
  document.querySelector('[data-target="allmeta"]').addEventListener('click', () => {
    const title = document.getElementById('title').textContent.trim();
    const description = document.getElementById('description').textContent.trim();
    const h1 = document.getElementById('h1').textContent.trim();
    const keywords = document.getElementById('keywords').textContent.trim();
    const url = document.getElementById('current-url').textContent.trim();

    const allMeta = `URL: ${url}\nTitle: ${title}\nDescription: ${description}\nH1: ${h1}\nKeywords: ${keywords}`;
    copyToClipboard(allMeta, event.currentTarget);
    });

    // Обработчики для отдельных кнопок копирования
    document.querySelectorAll('.copy-button').forEach(button => {
      button.addEventListener('click', (event) => {
        const targetId = button.getAttribute('data-target');
        if (targetId !== 'allmeta') {
          const content = document.getElementById(targetId).textContent.trim();
          copyToClipboard(content, event.currentTarget);
        }
    });
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle-none');
  const toggleIcon = toggleButton.querySelector('i');

  // Загрузка состояния из storage
  chrome.storage.sync.get(['toggleDisplayNone'], (result) => {
    const isOn = result.toggleDisplayNone || false;
    toggleIcon.classList.toggle('fa-toggle-on', isOn);
    toggleIcon.classList.toggle('fa-toggle-off', !isOn);

    // Отправка текущего состояния на контентную страницу
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { toggle: isOn });
    });
  });

  // Обработчик нажатия на кнопку
  toggleButton.addEventListener('click', () => {
    const currentlyOn = toggleIcon.classList.contains('fa-toggle-on');

    toggleIcon.classList.toggle('fa-toggle-on', !currentlyOn);
    toggleIcon.classList.toggle('fa-toggle-off', currentlyOn);

    // Сохранение состояния в storage
    chrome.storage.sync.set({ toggleDisplayNone: !currentlyOn });

    // Отправка команды контентному скрипту
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { toggle: !currentlyOn });
    });
  });
});

// Получаем ссылку на элементы
const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('saveKey');
const statusMessage = document.getElementById('status');
const limitsElement = document.getElementById('CheckTrustLimits'); // Элемент для отображения баланса

// Функция для получения баланса
function fetchBalance(apiKey) {
  const apiUrl = `https://checktrust.ru/app.php?r=host/app/summary/basic&applicationKey=${apiKey}&host=google.com&parameterList=hostLimitsBalance`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      //console.log('API Response:', data); // Выводим ответ в консоль
      if (data && data.success) {
        const balance = data.hostLimitsBalance; // Прямо здесь получаем hostLimitsBalance
        if (balance !== undefined) {
          limitsElement.textContent = `Баланс: ${balance}`;
        } else {
          limitsElement.textContent = 'Баланс: Ошибка: Баланс не найден в ответе.';
        }
      } else {
        limitsElement.textContent = 'Баланс: Ошибка при получении баланса';
      }
    })
    .catch((error) => {
      //console.error('Ошибка запроса баланса:', error);
      limitsElement.textContent = 'Баланс: Ошибка при запросе баланса';
    });
}

// Загружаем сохраненный API ключ при открытии popup
chrome.storage.sync.get('apiKey', (data) => {
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
    fetchBalance(data.apiKey); // Получаем баланс сразу после загрузки ключа
  }
});

// Сохраняем API ключ в хранилище
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (apiKey) {
    chrome.storage.sync.set({ apiKey: apiKey }, () => {
      statusMessage.textContent = 'API ключ сохранен!';
      statusMessage.style.color = 'green';
      fetchBalance(apiKey); // Получаем баланс сразу после сохранения ключа
    });
  } else {
    statusMessage.textContent = 'Введите валидный API ключ!';
    statusMessage.style.color = 'red';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const checkTrustButton = document.getElementById('checktrustbutton');

  // Функция для обновления иконки кнопки
  function updateButtonIcon(isEnabled) {
    const icon = checkTrustButton.querySelector('i');
    if (isEnabled) {
      icon.classList.remove('fa-toggle-off');
      icon.classList.add('fa-toggle-on');
    } else {
      icon.classList.remove('fa-toggle-on');
      icon.classList.add('fa-toggle-off');
    }
  }

  // Инициализация состояния кнопки
  chrome.storage.sync.get('functionsEnabled', (data) => {
    const isEnabled = data.functionsEnabled || false; // Значение по умолчанию: false
    updateButtonIcon(isEnabled); // Обновляем иконку кнопки
  });

  // Обработчик клика по кнопке
  checkTrustButton.addEventListener('click', () => {
    chrome.storage.sync.get('functionsEnabled', (data) => {
      const isEnabled = data.functionsEnabled || false; // Получаем текущее состояние

      const newState = !isEnabled; // Переключаем состояние
      updateButtonIcon(newState); // Обновляем иконку кнопки

      // Сохраняем новое состояние в chrome.storage
      chrome.storage.sync.set({ functionsEnabled: newState }, () => {
        //console.log('Состояние сохранено:', newState);
      });

      // Отправляем сообщение в content.js для активации/деактивации функций
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const action = newState ? 'enable' : 'disable';
        chrome.tabs.sendMessage(tabs[0].id, { action });
      });
    });
  });
});

// Получаем элементы
const toggleButton = document.getElementById('toggle-numbers');
const icon = toggleButton.querySelector('i');

// Функция для изменения состояния кнопки
function toggleNumbers() {
  // Читаем текущее состояние из chrome storage
  chrome.storage.sync.get('numbersVisible', function(data) {
    let numbersVisible = data.numbersVisible || false;

    // Toggle visibility
    numbersVisible = !numbersVisible;
    $('.topvisor-number').toggle(numbersVisible);

    // Обновляем иконку
    $('#toggle-numbers i').toggleClass('fa-toggle-on fa-toggle-off');

    // Сохраняем новое состояние в chrome storage
    chrome.storage.sync.set({ numbersVisible: numbersVisible });

    // Отправляем сообщение для включения или выключения нумерации на страницах
    chrome.runtime.sendMessage({ action: numbersVisible ? 'enableNumeric' : 'disableNumeric' });
  });
}

// Обработчик клика на кнопку
$(document).ready(function() {
  // Инициализация состояния кнопки на основе chrome storage
  chrome.storage.sync.get('numbersVisible', function(data) {
    let isNumericEnabled = data.numbersVisible || false;

    // Устанавливаем начальное состояние кнопки
    if (isNumericEnabled) {
      $('#toggle-numbers').addClass('active');
      $('#toggle-numbers i').removeClass('fa-toggle-off').addClass('fa-toggle-on');
    } else {
      $('#toggle-numbers').removeClass('active');
      $('#toggle-numbers i').removeClass('fa-toggle-on').addClass('fa-toggle-off');
    }
  });

  // Обработчик клика на кнопку
  $('#toggle-numbers').on('click', toggleNumbers);
});

document.addEventListener("DOMContentLoaded", () => {
  const speedElement = document.getElementById("speed-page");
  
  // Получаем ID текущей активной вкладки
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
  
      if (currentTab) {
       // Сначала проверяем, есть ли данные в background.js
       chrome.runtime.sendMessage(
          { type: "GET_PAGE_LOAD_TIME", tabId: currentTab.id },
          (response) => {
           if (response && response.loadTime) {
              updateLoadTime(response.loadTime);
           } else {
              // Если данных нет, пытаемся выполнить скрипт на вкладке
              getLoadTimeFromTab(currentTab.id);
           }
          }
       );
      }
  });
  
  // Функция для обновления времени загрузки в DOM
  function updateLoadTime(loadTime) {
      const loadTimeHtml = `${loadTime} <span data-translation="seconds">сек</span>`;
      speedElement.innerHTML = loadTimeHtml;
  }
  
  // Функция для выполнения скрипта на вкладке и получения времени загрузки
  function getLoadTimeFromTab(tabId) {
      chrome.scripting.executeScript(
       {
          target: { tabId: tabId },
          func: () => {
           const timing = performance.timing;
           const loadTime = (
              (timing.domContentLoadedEventEnd - timing.navigationStart) /
              1000
           ).toFixed(1);
           return loadTime;
          },
       },
       (results) => {
          if (chrome.runtime.lastError || !results || !results[0]) {
           speedElement.textContent = "Не удалось определить";
          } else {
           const loadTime = results[0].result;
           updateLoadTime(loadTime);
  
           // Сохраняем данные в background.js
           chrome.runtime.sendMessage({
              type: "SET_PAGE_LOAD_TIME",
              tabId: tabId,
              loadTime: loadTime,
           });
          }
       }
      );
  }
  });


  document.addEventListener("DOMContentLoaded", function () {
    const yandexResultElement = document.getElementById("yandex-result-index");
    const googleResultElement = document.getElementById("google-result-index");
  
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = new URL(tabs[0].url);
      const hostname = url.hostname;
      const hostnameWithoutWWW = hostname.replace("www.", "");
  
      const yandexSearchUrlFull = `https://yandex.ru/search/?text=host:${hostname}`;
      const yandexSearchUrlWithoutWWW = `https://yandex.ru/search/?text=host:${hostnameWithoutWWW}`;
      const googleSearchUrl = `https://www.google.com/search?q=site:${hostname}`;
  
      // Флаг для предотвращения повторных запросов при капче
      let isCaptchaDetected = false;
  
      async function fetchIndexedPages(engine, queryUrl) {
        try {
          // Проверка на кэшированные данные
          const cachedData = localStorage.getItem(`${engine}-count-${hostnameWithoutWWW}`);
          if (cachedData) {
            const data = JSON.parse(cachedData);
            const age = Date.now() - data.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 1 день
      
            if (age < maxAge) {
              return data.count;
            }
          }
      
          // Если капча была обнаружена, прекращаем запросы
          if (isCaptchaDetected) {
            return `<br><br>Капча: <a href="#" style="pointer-events: none; text-decoration: none;">Пройти капчу</a>`;
          }
      
          const response = await fetch(queryUrl);
      
          // Проверка на ошибку 429 (капча)
          if (response.status === 429) {
            isCaptchaDetected = true; // Устанавливаем флаг капчи
            const captchaUrl = response.url;
            return `<br><br>Капча: <a href="${captchaUrl}" target="_blank">Пройти капчу</a>`;
          }
      
          const text = await response.text();
      
          let resultCount = 0;
      
          if (engine === "yandex") {
            // Пытаемся найти количество результатов в разных вариантах
            let match = text.match(/нашлось ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i);
      
            if (!match) {
              match = text.match(/нашёлся ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i); // вариант с "нашёлся"
            }
      
            if (!match) {
              match = text.match(/найдено ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i); // вариант с "найдено"
            }
      
            if (!match) {
              match = text.match(/host:[^]+ — Яндекс: нашёлся ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i); // альтернативный вариант
            }
      
            if (!match) {
              match = text.match(/host:[^]+ — Яндекс: нашлась ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i); // вариант с "нашлась"
            }
      
            if (match) {
              let result = match[1].replace(/\s|\u00a0/g, "")
                                     .replace("тыс.", "000")
                                     .replace("млн.", "000000")
                                     .replace("млрд.", "000000000")
                                     .replace("тыс", "000") // также склонения без точки
                                     .replace("млн", "000000")
                                     .replace("млрд", "000000000");
      
              resultCount = parseInt(result, 10);
            } else {
              // Если данные не были найдены с полным доменом, пробуем с доменом без www
              const responseWithoutWWW = await fetch(yandexSearchUrlWithoutWWW);
              const textWithoutWWW = await responseWithoutWWW.text();
      
              // Повторяем аналогичную обработку для версии без www
              match = textWithoutWWW.match(/нашлось ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i);
              if (!match) {
                match = textWithoutWWW.match(/нашёлся ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i);
              }
      
              if (!match) {
                match = textWithoutWWW.match(/host:[^]+ — Яндекс: нашёлся ([\d\s\u00a0]+(?:тыс\.)?(?:млн\.)?(?:млрд\.)?)/i);
              }
      
              if (match) {
                let result = match[1].replace(/\s|\u00a0/g, "")
                                       .replace("тыс.", "000")
                                       .replace("млн.", "000000")
                                       .replace("млрд.", "000000000")
                                       .replace("тыс", "000") // также склонения без точки
                                       .replace("млн", "000000")
                                       .replace("млрд", "000000000");
      
                resultCount = parseInt(result, 10);
              }
            }
          } else if (engine === "google") {
            const match = text.match(/<div id="result-stats">Результатов: примерно ([\d\s,]+(?:тыс\.|млн\.|млрд\.)?)/i);
            if (match) {
              let result = match[1]
                .replace(/,/g, "")
                .replace(/\s/g, "")
                .replace("тыс.", "000")
                .replace("млн.", "000000")
                .replace("млрд.", "000000000");
              resultCount = parseInt(result, 10);
            }
          }
      
          // Если запрос успешен и не является капчей или 0, сохраняем данные в кэш
          if (resultCount > 0 && resultCount !== 'Капча') {
            localStorage.setItem(`${engine}-count-${hostnameWithoutWWW}`, JSON.stringify({
              count: resultCount,
              timestamp: Date.now() // Сохраняем метку времени
            }));
          }
      
          return resultCount;
        } catch (error) {
          return 0;
        }
      }
      
  
      async function updateYandexIndex() {
        const count = await fetchIndexedPages("yandex", yandexSearchUrlFull);

        if (typeof count === 'string' && count.includes("Капча")) {
            yandexResultElement.innerHTML = `<i class="fas fa-exclamation-circle" style="color: orange;"></i> ${count}`;
        } else if (count > 0) {
            yandexResultElement.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> ${count.toLocaleString()}`;
        } else {
            yandexResultElement.innerHTML = `<i class="fas fa-exclamation-circle" style="color: orange;"></i> 0<br><br>Попробуйте проверить вручную: <a href="${yandexSearchUrlFull}" target="_blank">Проверить</a>`;
        }
    }

    async function updateGoogleIndex() {
        const count = await fetchIndexedPages("google", googleSearchUrl);

        if (typeof count === 'string' && count.includes("Капча")) {
            googleResultElement.innerHTML = `<i class="fas fa-exclamation-circle" style="color: orange;"></i> ${count}`;
        } else if (count > 0) {
            googleResultElement.innerHTML = `<i class="fas fa-check-circle" style="color: green;"></i> ${count.toLocaleString()}`;
        } else {
            googleResultElement.innerHTML = `<i class="fas fa-exclamation-circle" style="color: orange;"></i> 0<br><br>Попробуйте проверить вручную: <a href="${googleSearchUrl}" target="_blank">Проверить</a>`;
        }
    }
  
      updateYandexIndex();
      updateGoogleIndex();
    });
  });

// Футер
  const marketingBlocks = document.querySelectorAll('.marketinginfo');
  let currentIndex = 0;
  
  // Изначально показываем первый блок
  marketingBlocks[currentIndex].classList.add('active');
  
  setInterval(() => {
    // Убираем активный класс у текущего блока
    marketingBlocks[currentIndex].classList.remove('active');
  
    // Переходим к следующему блоку
    currentIndex = (currentIndex + 1) % marketingBlocks.length;
  
    // Добавляем активный класс новому блоку
    marketingBlocks[currentIndex].classList.add('active');
  }, 5000); // 5000 миллисекунд = 5 секунд
