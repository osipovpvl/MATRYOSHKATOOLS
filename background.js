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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_DOMAIN") {
    const { domain } = message;
    const apiKey = "c32b4abd558dbff2397e17546a77bc65";
    const apiUrl = `https://checktrust.ru/app.php?r=host/app/summary/basic&applicationKey=${apiKey}&host=${domain}&parameterList=trust,spam`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        sendResponse({ trust: data.trust, spam: data.spam });
      })
      .catch((error) => {
        //console.error("Error fetching domain data:", error);
        sendResponse(null);
      });

    return true; // Keeps the message channel open for async response
  }
});

chrome.action.onClicked.addListener(function (tab) {
  // Получаем заголовок страницы
  let pageTitle = tab.title;

  // Получаем домен сайта
  let currentDomain = new URL(tab.url).hostname;

  // Формируем поисковый запрос
  let searchQuery = `title:("${pageTitle}") site:${currentDomain}`;

  // Формируем URL для поиска в Яндексе
  let searchUrl = `https://yandex.ru/search/?text=${encodeURIComponent(searchQuery)}`;

  // Открываем поиск в Яндексе в новой вкладке
  chrome.tabs.create({ url: searchUrl });
});