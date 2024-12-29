document.addEventListener("DOMContentLoaded", async () => {
  // Handle tabs
  const tabs = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Toggle active tab
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Toggle tab content
      tabContents.forEach((content) => {
        content.classList.remove("active");
      });
      document.getElementById(tab.getAttribute("data-tab")).classList.add("active");
    });
  });

  // Load SEO Data
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: scrapeSEOData,
    },
    (results) => {
      const seoData = results[0].result;

      // Populate SEO data
      populateMetaData("title", seoData.title, seoData.title?.length || 0);
      populateMetaData("description", seoData.description, seoData.description?.length || 0);
      populateMetaData("keywords", seoData.keywords, seoData.keywords?.length || 0);
      populateMetaData("h1", seoData.h1, seoData.h1?.length || 0);
      document.getElementById("current-url").textContent = tab.url || "N/A";
      //document.getElementById("links").textContent = seoData.linksCount || "N/A";
      //document.getElementById("images-count").textContent = seoData.imagesCount || "N/A";
      document.getElementById("lang").textContent = seoData.lang || "N/A";
      document.getElementById("site-ip").textContent = seoData.siteIP || "N/A";

      
      // Populate microdata
      populateMicrodata("open-graph", seoData.openGraph, "og:");
      populateMicrodata("twitter-cards", seoData.twitterCards, "twitter:");
      populateMicrodata("schema-org", seoData.schemaOrg, "Schema.org");
      populateMicrodata("rdfa", seoData.rdfa, "RDFa");
      populateMicrodata("microdata-check", seoData.microdata, "Microdata");

      // Add event listeners for copy buttons
      document.querySelectorAll(".copy-button").forEach((button) => {
        button.addEventListener("click", () => {
          const targetId = button.getAttribute("data-target");
          const textToCopy = document.getElementById(targetId).textContent;

          navigator.clipboard.writeText(textToCopy).then(() => {
            const status = document.getElementById("copy-status");
            status.classList.remove("hidden");
            status.textContent = `${targetId.charAt(0).toUpperCase() + targetId.slice(1)} copied!`;
            setTimeout(() => status.classList.add("hidden"), 2000);
          });
        });
      });
    }
  );

  // Add event listeners for the "Page" tab functionalities

  document.getElementById("highlight-noindex").addEventListener("click", () => {
    highlightNoIndex(tab.id);
  });

  document.getElementById("highlight-nofollow").addEventListener("click", () => {
    highlightNoFollow(tab.id);
  });


  // Other event listeners
  document.getElementById("toggle-js").addEventListener("click", () => {
    toggleScripts(tab.id);
  });

  document.getElementById("toggle-css").addEventListener("click", () => {
    toggleStyles(tab.id);
  });

  document.getElementById("copy-url").addEventListener("click", () => {
    copyToClipboard(tab.url);
  });


  document.getElementById("open-cache").addEventListener("click", () => {
    openGoogleCache(tab.url);
  });

  document.getElementById("check-speed").addEventListener("click", () => {
    openPageSpeedInsights(tab.url);
  });

  document.getElementById("check-mobile").addEventListener("click", () => {
    openPageSpeedInsightsMobile(tab.url);
  });

  
});

// Function to highlight noindex elements
function highlightNoIndex(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const noIndexElements = document.querySelectorAll('[content="noindex"], meta[content="noindex"], [rel="noindex"]');
      noIndexElements.forEach((el) => {
        el.style.outline = "2px solid red";
      });
    },
  });
}

// Function to highlight nofollow links
function highlightNoFollow(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const noFollowLinks = document.querySelectorAll('a[rel="nofollow"]');
      noFollowLinks.forEach((link) => {
        link.style.outline = "2px solid blue";
      });
    },
  });
}

// Function to show alt text for images
function showAltText(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const images = document.querySelectorAll("img");
      const altTexts = Array.from(images)
        .map((img) => img.alt)
        .filter((alt) => alt !== "");
      alert(`Alt Texts: \n${altTexts.join("\n") || "No alt text found"}`);
    },
  });
}

// Function to toggle highlighting
function toggleHighlight(tabId, type) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (type) => {
      const elements =
        type === "headings"
          ? document.querySelectorAll("h1, h2, h3, h4, h5, h6")
          : document.querySelectorAll("[rel='nofollow'], noindex");

      elements.forEach((el) => {
        el.style.outline = "2px solid red";
      });
    },
    args: [type],
  });
}

// Function to toggle JavaScript
function toggleScripts(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const scripts = document.querySelectorAll("script");
      scripts.forEach((script) => (script.disabled = !script.disabled));
    },
  });
}

// Function to toggle CSS
function toggleStyles(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const links = document.querySelectorAll("link[rel='stylesheet']");
      links.forEach((link) => (link.disabled = !link.disabled));
    },
  });
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied URL to clipboard");
  });
}

// Function to send revisit request
function sendRevisitRequest(url) {
  alert(`Sending revisit request for ${url}...`);
}

// Function to check server response
function checkResponse(url) {
  alert(`Checking server response for ${url}...`);
}

// Function to open Google Cache
function openGoogleCache(url) {
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${url}`;
  window.open(cacheUrl, "_blank");
}

// Function to open PageSpeed Insights
function openPageSpeedInsights(url) {
  const insightsUrl = `https://pagespeed.web.dev/?url=${url}`;
  window.open(insightsUrl, "_blank");
}

// Function to open PageSpeed Insights for mobile
function openPageSpeedInsightsMobile(url) {
  const insightsUrl = `https://pagespeed.web.dev/?url=${url}&category=mobile`;
  window.open(insightsUrl, "_blank");
}

// Function to get text stats
function getTextStats(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const text = document.body.innerText;
      alert(`Text length: ${text.length} characters`);
    },
  });
}

// Function to populate meta data
function populateMetaData(id, value, length) {
  const element = document.getElementById(id);
  const lengthElement = document.getElementById(`${id}-length`);

  element.textContent = value || "N/A";
  lengthElement.textContent = `Символов: ${length}`;
}

// Function to populate microdata content
function populateMicrodata(elementId, data, label) {
  const container = document.getElementById(elementId);
  container.innerHTML = ""; // Clear previous content

  if (data && data.length > 0) {
    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "microdata-item";
      div.textContent = item;
      container.appendChild(div);
    });
  } else {
    container.textContent = `${label} data not found.`;
  }
}

// Function to scrape SEO data from the page
function scrapeSEOData() {
  const extractStructuredData = (selector, attribute = "content") => {
    return Array.from(document.querySelectorAll(selector)).map(el => `${el.getAttribute("property") || el.getAttribute("name")}: ${el.getAttribute(attribute) || el.outerHTML}`);
  };

  return {
    title: document.querySelector("title")?.innerText || "No Title",
    description: document.querySelector('meta[name="description"]')?.content || "No Description",
    keywords: document.querySelector('meta[name="keywords"]')?.content || "No Keywords",
    h1: document.querySelector("h1")?.innerText || "No H1",
    linksCount: document.querySelectorAll("a[href]").length,
    imagesCount: document.querySelectorAll("img").length,
    lang: document.documentElement.lang || "No Lang Attribute",
    siteIP: location.host,

    // Extract specific microdata
    openGraph: extractStructuredData('meta[property^="og:"]'),
    twitterCards: extractStructuredData('meta[name^="twitter:"]'),
    schemaOrg: extractStructuredData('[type="application/ld+json"]', "textContent"),
    rdfa: extractStructuredData('[prefix]'),
    microdata: extractStructuredData('[itemscope]'),
  };
}


document.addEventListener('DOMContentLoaded', () => {
  // Слушатели для кнопок во вкладке "Поиск"
  document.getElementById('check-index-yandex').addEventListener('click', () => {
      getCurrentUrl((url) => {
          openTab(`https://yandex.ru/search/?text=${encodeURIComponent(url)}&lr=213`);
      });
  });

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

  document.getElementById('operator-site-google').addEventListener('click', () => {
      getCurrentUrl((url) => {
          openTab(`https://www.google.com/search?q=site:${encodeURIComponent(url)}`);
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

  document.getElementById('operator-title-yandex').addEventListener('click', () => {
      const title = prompt('Введите заголовок страницы (title):', 'Пример заголовка');
      if (title) {
          getCurrentUrl((url) => {
              openTab(`https://yandex.ru/search/?text=title:(\"${title}\") site:${encodeURIComponent(url)}`);
          });
      }
  });

  document.getElementById('search-yandex-maps').addEventListener('click', () => {
    const organization = prompt('Введите название организации для поиска в Яндекс.Картах:');
    if (organization) {
        openTab(`https://yandex.ru/maps/?text=${encodeURIComponent(organization)}`);
    }
});

document.getElementById('search-google-maps').addEventListener('click', () => {
    const organization = prompt('Введите название организации для поиска в Google.Картах:');
    if (organization) {
        openTab(`https://www.google.com/maps/search/${encodeURIComponent(organization)}`);
    }
});

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

document.addEventListener('DOMContentLoaded', () => {
  // Функция для проверки длины и окрашивания
  function updateMetaLengthStyles(id, length, validRange) {
      const element = document.getElementById(id);
      if (!element) return;

      if (length >= validRange[0] && length <= validRange[1]) {
          element.style.color = "green";
          element.style.fontWeight = "bold";
      } else {
          element.style.color = "red";
          element.style.fontWeight = "bold";
      }
  }

  // Пример обработки для Title
  const title = document.querySelector('title')?.innerText || "";
  const titleLength = title.length;
  const titleLengthElement = document.getElementById('title-length');
  if (titleLengthElement) {
      titleLengthElement.textContent = `Длина: ${titleLength}`;
      updateMetaLengthStyles('title-length', titleLength, [60, 80]);
  }

  // Пример обработки для Description
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || "";
  const descriptionLength = metaDescription.length;
  const descriptionLengthElement = document.getElementById('description-length');
  if (descriptionLengthElement) {
      descriptionLengthElement.textContent = `Длина: ${descriptionLength}`;
      updateMetaLengthStyles('description-length', descriptionLength, [150, 200]);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const linksContainer = document.getElementById("links-details");
  let allLinks = []; // Хранит все ссылки для фильтрации
  let displayedLinks = []; // Хранит отфильтрованные ссылки, которые отображаются на странице

  // Получаем все ссылки на странице
  function fetchLinks() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          files: ["content.js"]
        },
        () => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "collectLinks" }, response => {
            if (response && response.links) {
              allLinks = response.links;
              displayedLinks = [...allLinks]; // Изначально отображаем все ссылки
              displayLinks(displayedLinks);
              updateCounts(displayedLinks, tabs[0].url); // Учет текущего URL для внутренних/внешних ссылок
            } else {
              console.error("Не удалось получить ссылки с текущей страницы.");
            }
          });
        }
      );
    });
  }

  // Отображение ссылок
  function displayLinks(links) {
    linksContainer.innerHTML = ""; // Очищаем контейнер перед обновлением
    if (links.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "link-detail";
      emptyDiv.textContent = "Ссылок не найдено.";
      linksContainer.appendChild(emptyDiv);
      return;
    }

    links.forEach(link => {
      const div = document.createElement("div");
      div.className = "link-detail";
      div.innerHTML = `
        <span><strong>Text:</strong> ${link.text}</span>
        <span><strong>Href:</strong> <a href="${link.href}" target="_blank">${link.href}</a></span>
        <span><strong>Protocol:</strong> ${link.protocol}</span>
        <span><strong>Rel:</strong> ${link.rel}</span>
        <span><strong>Visible:</strong> ${link.visible}</span>
        <span><strong>Status:</strong> <span class="status-text">Не проверено</span></span>
      `;
      linksContainer.appendChild(div);
    });
  }

  // Обновление статистики ссылок
  function updateCounts(links, currentUrl) {
    const currentHost = new URL(currentUrl).hostname;

    document.getElementById("total-links").textContent = links.length;
    document.getElementById("internal-links").textContent = links.filter(link => {
      try {
        return new URL(link.href, currentUrl).hostname === currentHost;
      } catch (e) {
        return false; // Пропускаем некорректные ссылки
      }
    }).length;
    document.getElementById("external-links").textContent = links.filter(link => {
      try {
        return new URL(link.href, currentUrl).hostname !== currentHost;
      } catch (e) {
        return false; // Пропускаем некорректные ссылки
      }
    }).length;
    document.getElementById("https-links").textContent = links.filter(link => link.protocol === "https").length;
    document.getElementById("http-links").textContent = links.filter(link => link.protocol === "http").length;
    document.getElementById("other-links").textContent = links.filter(link => !["https", "http"].includes(link.protocol)).length;
    document.getElementById("follow-links").textContent = links.filter(link => {
      return !link.rel || !link.rel.includes("nofollow");
    }).length;
    document.getElementById("nofollow-links").textContent = links.filter(link => {
      return link.rel.includes("nofollow");
    }).length;
    document.getElementById("other-attributes").textContent = links.filter(link => {
      return link.rel && !link.rel.includes("nofollow") && !link.rel.includes("follow");
    }).length;
  }

  // Функция для проверки статуса ссылок
  async function checkLinksStatus() {
    const statusElements = linksContainer.querySelectorAll(".link-detail");

    for (let i = 0; i < statusElements.length; i++) {
      const link = displayedLinks[i];
      const statusText = statusElements[i].querySelector(".status-text");

      if (statusText) {
        statusText.textContent = "Проверка..."; // Изначально показываем, что идет проверка

        try {
          const response = await fetch(link.href, { method: 'HEAD' });
          if (response.ok) {
            statusText.textContent = `Status: ${response.status}`;
            statusText.classList.add('success');
          } else if (response.status === 404) {
            statusText.textContent = `Error: ${response.status}`;
            statusText.classList.add('error');
          } else if (response.status === 301 || response.status === 500) {
            statusText.textContent = `Warning: ${response.status}`;
            statusText.classList.add('warning');
          } else {
            statusText.textContent = `Status: ${response.status}`;
          }
        } catch (error) {
          statusText.textContent = `Error: ${error.message}`;
          statusText.classList.add('error');
        }
      }
    }
  }

  // Функция для копирования ссылок в буфер обмена
  function copyLinksToClipboard() {
    const linksText = displayedLinks.map(link => link.href).join("\n");
    navigator.clipboard.writeText(linksText)
      .then(() => {
        alert("Ссылки скопированы в буфер обмена!");
      })
      .catch(err => {
        console.error("Ошибка при копировании: ", err);
      });
  }

  // Функция для экспорта ссылок в CSV файл с UTF-8 кодировкой
  function exportLinksToCSV() {
    const csvContent = "Text, Href, Protocol, Rel, Visible, Status\n" + 
      displayedLinks.map(link => `"${link.text}", "${link.href}", "${link.protocol}", "${link.rel}", "${link.visible}", "Не проверено"`).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "links.csv";
    link.click();
  }

  // Привязка событий к кнопкам
  document.getElementById("check-links-status").addEventListener("click", checkLinksStatus);
  document.getElementById("copy-links").addEventListener("click", copyLinksToClipboard);
  document.getElementById("export-links").addEventListener("click", exportLinksToCSV);

  // Слушатели для фильтрации ссылок
  document.getElementById("show-all-links").addEventListener("click", () => filterLinks("all", window.location.href));
  document.getElementById("show-internal-links").addEventListener("click", () => filterLinks("internal", window.location.href));
  document.getElementById("show-external-links").addEventListener("click", () => filterLinks("external", window.location.href));
  document.getElementById("show-https-links").addEventListener("click", () => filterLinks("https", window.location.href));
  document.getElementById("show-http-links").addEventListener("click", () => filterLinks("http", window.location.href));
  document.getElementById("show-other-protocols").addEventListener("click", () => filterLinks("other", window.location.href));
  document.getElementById("show-follow-links").addEventListener("click", () => filterLinks("follow", window.location.href));
  document.getElementById("show-nofollow-links").addEventListener("click", () => filterLinks("nofollow", window.location.href));
  document.getElementById("show-other-attributes").addEventListener("click", () => filterLinks("other-attributes", window.location.href));

  // Функция для фильтрации ссылок
  function filterLinks(type, currentUrl) {
    const currentHost = new URL(currentUrl).hostname;

    switch (type) {
      case "all":
        displayedLinks = allLinks;
        break;
      case "internal":
        displayedLinks = allLinks.filter(link => {
          try {
            return new URL(link.href, currentUrl).hostname === currentHost;
          } catch (e) {
            return false; // Пропускаем некорректные ссылки
          }
        });
        break;
      case "external":
        displayedLinks = allLinks.filter(link => {
          try {
            return new URL(link.href, currentUrl).hostname !== currentHost;
          } catch (e) {
            return false; // Пропускаем некорректные ссылки
          }
        });
        break;
      case "https":
        displayedLinks = allLinks.filter(link => link.protocol === "https");
        break;
      case "http":
        displayedLinks = allLinks.filter(link => link.protocol === "http");
        break;
      case "other":
        displayedLinks = allLinks.filter(link => !["https", "http"].includes(link.protocol));
        break;
      case "follow":
        displayedLinks = allLinks.filter(link => !link.rel || !link.rel.includes("nofollow"));
        break;
      case "nofollow":
        displayedLinks = allLinks.filter(link => link.rel.includes("nofollow"));
        break;
      case "other-attributes":
        displayedLinks = allLinks.filter(link => link.rel && !link.rel.includes("nofollow") && !link.rel.includes("follow"));
        break;
      default:
        displayedLinks = [];
        break;
    }

    displayLinks(displayedLinks); // Обновляем отображаемые ссылки
  }

  // Загрузка данных ссылок при старте
  fetchLinks();
});



document.addEventListener("DOMContentLoaded", function () {
  const imageSummaryButtons = document.querySelectorAll("#image-summary button");
  const imageList = document.getElementById("image-list");

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
      imgPreview.style.maxWidth = "50px";
      imgPreview.style.maxHeight = "50px";
      imgPreview.style.marginRight = "10px";

      // Информация об изображении
      const infoContainer = document.createElement("div");
      infoContainer.style.display = "flex";
      infoContainer.style.flexDirection = "column";

      const altText = document.createElement("span");
      altText.textContent = img.alt ? `Alt: "${img.alt}"` : "Alt отсутствует";

      const formatText = document.createElement("span");
      formatText.textContent = `Формат: ${img.format}`;

      const sizeText = document.createElement("span");
      sizeText.textContent = `Размер: ${img.width}x${img.height}px`;

      const weightText = document.createElement("span");
      weightText.textContent = `Вес: ${img.sizeInKB} КБ`;

      // Добавляем информацию в контейнер
      infoContainer.appendChild(altText);
      infoContainer.appendChild(formatText);
      infoContainer.appendChild(sizeText);
      infoContainer.appendChild(weightText);

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
  }

  function fetchImages(filter = "all") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getImages" }, response => {
        if (response && response.images) {
          updateImageDetails(filter, response.images);
        } else {
          console.error("Не удалось получить данные об изображениях.");
        }
      });
    });
  }

  imageSummaryButtons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");
      fetchImages(filter);
    });
  });

  fetchImages();
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
          console.error("Ошибка при копировании: ", err);
        });
      }
    });
  });
});

function fetchMetrics() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getMetrics" }, response => {
      if (response) {
        // Обновляем данные в таблице
        document.getElementById("yandex-metrika").textContent = response.yandexMetrika.length
          ? response.yandexMetrika.join(", ")
          : "Не найдено";

        document.getElementById("google-tag-manager").textContent = response.googleTagManager.length
          ? response.googleTagManager.join(", ")
          : "Не найдено";

        document.getElementById("google-analytics").textContent = response.googleAnalytics.length
          ? response.googleAnalytics.join(", ")
          : "Не найдено";
      } else {
        console.error("Не удалось получить данные о метриках.");
      }
    });
  });
}

// Вызываем при загрузке расширения
document.addEventListener("DOMContentLoaded", () => {
  fetchMetrics();
});


function fetchMetrics() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getMetrics" }, response => {
      if (response) {
        // Обновляем данные в таблице
        updateMetricStatus("yandex-metrika", response.yandexMetrika);
        updateMetricStatus("google-tag-manager", response.googleTagManager);
        updateMetricStatus("google-analytics", response.googleAnalytics);
      } else {
        console.error("Не удалось получить данные о метриках.");
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

  element.appendChild(icon);
}

// Вызываем при загрузке расширения
document.addEventListener("DOMContentLoaded", () => {
  fetchMetrics();
});


function fetchCMSData() {
  const cmsElement = document.getElementById("cms-data");
  cmsElement.textContent = "Загрузка...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getCMS" },
      (response) => {
        if (response && response.name) {
          cmsElement.textContent = response.name;
        } else {
          cmsElement.textContent = "Неизвестно";
        }
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchCMSData();
});

// popup.js — скрипт для popup, который получает данные от content.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.pageSize) {
      // Обновляем элемент с id 'page-size' в popup с полученным размером страницы
      document.getElementById('page-size').textContent = message.pageSize + ' KB';
  }
});

// popup.js — скрипт для popup, который получает данные от content.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.pageSize) {
      // Обновляем элемент с id 'page-size' в popup с полученным размером страницы
      document.getElementById('page-size').textContent = message.pageSize + ' KB';
  }
  if (message.statusCode) {
      // Обновляем элемент с id 'response-code' в popup с полученным кодом ответа сервера
      document.getElementById('response-code').textContent = message.statusCode;
  }
});




document.addEventListener("DOMContentLoaded", () => {
  const headingsSummary = document.querySelector(".headings-summary");
  const headingsList = document.getElementById("headings-list");
  const structureDisplay = document.getElementById("structure-display");
  const highlightButton = document.getElementById("toggle-highlight-headings");

  // Флаг для отслеживания состояния подсветки
  let isHighlightActive = false;

  // Общение с содержимым страницы
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: extractHeadings,
      },
      (results) => {
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
        }
      }
    );
  });

  // Отображение заголовков
  function renderHeadings(type) {
    const filtered = type === "all" ? window.headingsData : window.headingsData.filter((h) => h.tagName === type);
    headingsList.innerHTML = filtered
      .map((h) => `<li><b>${h.tagName}:</b> ${h.text}</li>`)
      .join("");
    structureDisplay.innerHTML = ""; // Очистка структуры
  }

  // Отображение структуры заголовков
  function renderStructure() {
    structureDisplay.innerHTML = window.headingsStructure
      .map(
        (h) =>
          `<div style="margin-left: ${
            h.tagName === "H2" ? "10px" : h.tagName === "H3" ? "20px" : h.tagName === "H4" ? "30px" : "0"
          };"><b>${h.tagName}:</b> ${h.text}</div>`
      )
      .join("");
    headingsList.innerHTML = ""; // Очистка списка
  }

  // Обработчик кликов по блокам
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

  // Кнопка подсветки
  highlightButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: toggleHighlightHeadings,
          args: [isHighlightActive], // Передаем текущее состояние подсветки
        },
        () => {
          // Переключаем состояние подсветки
          isHighlightActive = !isHighlightActive;
          highlightButton.textContent = isHighlightActive ? "Отключить подсветку" : "Включить подсветку";
        }
      );
    });
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

  // Функция для включения/отключения подсветки заголовков (выполняется на странице)
  function toggleHighlightHeadings(isActive) {
    // Получаем все заголовки на странице
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

    if (isActive) {
      // Если подсветка уже включена, убираем её
      headings.forEach((heading) => {
        heading.style.outline = ""; // Убираем стиль
      });
    } else {
      // Если подсветка отключена, включаем её
      headings.forEach((heading) => {
        heading.style.outline = "2px dashed red"; // Добавляем стиль
      });
    }
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
      (item, index) => `${index + 1},${item.word},${item.count}`
    );
    // Объединяем заголовки и строки данных
    const csvContent = [csvHeader.join(","), ...csvRows].join("\n");
  
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
    const stopWords = ["и", "в", "на", "с", "по", "а"]; // Пример стоп-слов
    const waterWordsCount = words.filter((word) => stopWords.includes(word.toLowerCase())).length;
    return ((waterWordsCount / words.length) * 100).toFixed(2);
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

          const response = await fetch(tab.url);
          const html = await response.text();
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
      console.error("Ошибка выполнения: ", error);
  }
});

// Проверка каноничного адреса
function checkCanonical(doc, currentUrl, container) {
  const canonicalElement = doc.querySelector('link[rel="canonical"]');

  if (canonicalElement) {
      const canonicalUrl = canonicalElement.href;
      if (canonicalUrl === currentUrl) {
          container.innerHTML = `
              <span class="fas fa-check-circle" style="color: green;"></span>
              Каноничной страницей является текущая страница: <a href="${canonicalUrl}" target="_blank">${canonicalUrl}</a>
          `;
      } else {
          container.innerHTML = `
              <span class="fa fa-times-circle" style="color:red;"></span>
              Каноничной является другая страница: <a href="${canonicalUrl}" target="_blank">${canonicalUrl}</a>
          `;
      }
  } else {
      container.innerHTML = `
          <span class="fas fa-check-circle" style="color: green;"></span>
          Каноничный адрес не указан
      `;
  }
}

// Проверка Meta Robots
function checkMetaRobots(doc, container) {
  const metaElement = doc.querySelector('meta[name="robots"]');

  if (metaElement) {
      const content = metaElement.content;
      if (content.includes("noindex")) {
          container.innerHTML = `
              <span class="fa fa-times-circle" style="color:red;"></span>
              Индексация страницы запрещена (meta: ${content})
          `;
      } else {
          container.innerHTML = `
              <span class="fas fa-check-circle" style="color: green;"></span>
              Индексация страницы разрешена (meta: ${content})
          `;
      }
  } else {
      container.innerHTML = `
          <span class="fas fa-check-circle" style="color: green;"></span>
          Meta robots не указан (Индексация разрешена)
      `;
  }
}

// Проверка robots.txt
async function checkRobotsTxt(tabUrl, container) {
  const robotsUrl = new URL("/robots.txt", tabUrl).href;

  try {
      const response = await fetch(robotsUrl);
      if (!response.ok) {
          throw new Error("Не удалось загрузить robots.txt");
      }

      const robotsText = await response.text();
      const lines = robotsText.split("\n");
      const userAgents = {};
      let currentAgent = null;

      lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith("user-agent:")) {
              currentAgent = trimmed.split(":")[1].trim();
              userAgents[currentAgent] = [];
          } else if (
              currentAgent &&
              (trimmed.toLowerCase().startsWith("disallow:") ||
                  trimmed.toLowerCase().startsWith("allow:"))
          ) {
              userAgents[currentAgent].push(trimmed);
          }
      });

      let htmlContent = `<p>Файл robots.txt: <a href="${robotsUrl}" target="_blank">${robotsUrl}</a></p>`;
      htmlContent += "<p>Список User-agent и их статус:</p>";
      htmlContent += "<ul>";

      for (const [agent, rules] of Object.entries(userAgents)) {
          let isDisallowed = false;

          rules.forEach((rule) => {
              if (
                  rule.toLowerCase().startsWith("disallow:") &&
                  rule.split(":")[1].trim() === "/"
              ) {
                  isDisallowed = true;
              }
          });

          if (isDisallowed) {
              htmlContent += `<li>User-Agent: ${agent} <span class="fa fa-times-circle" style="color:red;"></span> Запрещено</li>`;
          } else {
              htmlContent += `<li>User-Agent: ${agent} <span class="fas fa-check-circle" style="color: green;"></span> Разрешено</li>`;
          }
      }

      htmlContent += "</ul>";
      container.innerHTML = htmlContent;
  } catch (error) {
      container.innerHTML = `
          <span class="fa fa-times-circle" style="color:red;"></span>
          Не удалось загрузить robots.txt
      `;
      console.error("Ошибка при загрузке robots.txt:", error);
  }
}


// Проверка sitemap.xml
async function checkSitemap(tabUrl, container) {
  const sitemapUrl = new URL("/sitemap.xml", tabUrl).href;

  try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
          throw new Error("Sitemap.xml не найден");
      }

      container.innerHTML = `
          <span class="fas fa-check-circle" style="color: green;"></span>
          Файл sitemap.xml: <a href="${sitemapUrl}" target="_blank">${sitemapUrl}</a>
      `;
  } catch (error) {
      container.innerHTML = `
          <span class="fa fa-times-circle" style="color:red;"></span>
          Sitemap.xml не найден
      `;
      console.error("Ошибка при загрузке sitemap.xml:", error);
  }
}
