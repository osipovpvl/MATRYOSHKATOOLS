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
      document.getElementById("canonical").textContent = seoData.canonical || "N/A";
      //document.getElementById("links").textContent = seoData.linksCount || "N/A";
      //document.getElementById("images-count").textContent = seoData.imagesCount || "N/A";
      document.getElementById("robots").textContent = seoData.metaRobots || "N/A";
      document.getElementById("lang").textContent = seoData.lang || "N/A";
      document.getElementById("site-ip").textContent = seoData.siteIP || "N/A";

      // Populate resources
      document.getElementById("robots-txt").innerHTML = `<a href="${seoData.robotsTxt}" target="_blank">${seoData.robotsTxt || "N/A"}</a>`;
      document.getElementById("sitemap-xml").innerHTML = `<a href="${seoData.sitemapXml}" target="_blank">${seoData.sitemapXml || "N/A"}</a>`;

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
  document.getElementById("highlight-headings").addEventListener("click", () => {
    toggleHighlight(tab.id, "headings");
  });

  document.getElementById("highlight-noindex").addEventListener("click", () => {
    highlightNoIndex(tab.id);
  });

  document.getElementById("highlight-nofollow").addEventListener("click", () => {
    highlightNoFollow(tab.id);
  });

  document.getElementById("show-alt-text").addEventListener("click", () => {
    showAltText(tab.id);
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

  document.getElementById("send-revisit").addEventListener("click", () => {
    sendRevisitRequest(tab.url);
  });

  document.getElementById("check-response").addEventListener("click", () => {
    checkResponse(tab.url);
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

  document.getElementById("text-stats").addEventListener("click", () => {
    getTextStats(tab.id);
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
    canonical: document.querySelector('link[rel="canonical"]')?.href || "No Canonical URL",
    linksCount: document.querySelectorAll("a[href]").length,
    imagesCount: document.querySelectorAll("img").length,
    metaRobots: document.querySelector('meta[name="robots"]')?.content || "No Meta Robots",
    lang: document.documentElement.lang || "No Lang Attribute",
    siteIP: location.host,


    robotsTxt: `${location.origin}/robots.txt`,
    sitemapXml: `${location.origin}/sitemap.xml`,

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
              displayLinks(allLinks);
              updateCounts(allLinks, tabs[0].url); // Учет текущего URL для внутренних/внешних ссылок
            } else {
              console.error("Не удалось получить ссылки с текущей страницы.");
            }
          });
        }
      );
    });
  }

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
      div.textContent = `Text: ${link.text}, Href: ${link.href}, Protocol: ${link.protocol}, Rel: ${link.rel}, Visible: ${link.visible}`;
      linksContainer.appendChild(div);
    });
  }

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
      // Все ссылки без rel или с rel, но не содержащим nofollow, считаются follow
      return !link.rel || !link.rel.includes("nofollow");
    }).length;
    document.getElementById("nofollow-links").textContent = links.filter(link => {
      // Ссылки с атрибутом nofollow
      return link.rel.includes("nofollow");
    }).length;
    document.getElementById("other-attributes").textContent = links.filter(link => {
      // Ссылки с другими атрибутами (не nofollow и не follow)
      return link.rel && !link.rel.includes("nofollow") && !link.rel.includes("follow");
    }).length;
  }

  function filterLinks(type, currentUrl) {
    const currentHost = new URL(currentUrl).hostname;

    switch (type) {
      case "all":
        displayLinks(allLinks);
        break;
      case "internal":
        displayLinks(allLinks.filter(link => {
          try {
            return new URL(link.href, currentUrl).hostname === currentHost;
          } catch (e) {
            return false; // Пропускаем некорректные ссылки
          }
        }));
        break;
      case "external":
        displayLinks(allLinks.filter(link => {
          try {
            return new URL(link.href, currentUrl).hostname !== currentHost;
          } catch (e) {
            return false; // Пропускаем некорректные ссылки
          }
        }));
        break;
      case "https":
        displayLinks(allLinks.filter(link => link.protocol === "https"));
        break;
      case "http":
        displayLinks(allLinks.filter(link => link.protocol === "http"));
        break;
      case "other":
        displayLinks(allLinks.filter(link => !["https", "http"].includes(link.protocol)));
        break;
      case "follow":
        displayLinks(allLinks.filter(link => !link.rel || !link.rel.includes("nofollow")));
        break;
      case "nofollow":
        displayLinks(allLinks.filter(link => link.rel.includes("nofollow")));
        break;
      case "other-attributes":
        displayLinks(allLinks.filter(link => link.rel && !link.rel.includes("nofollow") && !link.rel.includes("follow")));
        break;
      default:
        displayLinks([]);
        break;
    }
  }

  document.getElementById("show-all-links").addEventListener("click", () => filterLinks("all", window.location.href));
  document.getElementById("show-internal-links").addEventListener("click", () => filterLinks("internal", window.location.href));
  document.getElementById("show-external-links").addEventListener("click", () => filterLinks("external", window.location.href));
  document.getElementById("show-https-links").addEventListener("click", () => filterLinks("https", window.location.href));
  document.getElementById("show-http-links").addEventListener("click", () => filterLinks("http", window.location.href));
  document.getElementById("show-other-protocols").addEventListener("click", () => filterLinks("other", window.location.href));
  document.getElementById("show-follow-links").addEventListener("click", () => filterLinks("follow", window.location.href));
  document.getElementById("show-nofollow-links").addEventListener("click", () => filterLinks("nofollow", window.location.href));
  document.getElementById("show-other-attributes").addEventListener("click", () => filterLinks("other-attributes", window.location.href));

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
      const imgPreview = document.createElement("img");
      const altText = document.createElement("span");

      imgPreview.src = img.src;
      imgPreview.alt = img.alt || "Нет атрибута alt";
      altText.textContent = img.alt ? `Alt: "${img.alt}"` : "Alt отсутствует";

      li.appendChild(imgPreview);
      li.appendChild(altText);
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