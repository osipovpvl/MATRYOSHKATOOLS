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
        sendResponse(null);
      });

    return true;
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


// Отключение/включение Java Script
class ToggleJSWorker {
  constructor() {
    chrome.action.onClicked.addListener(this.toggleState.bind(this));  // Привязка события к кнопке
    chrome.windows.onFocusChanged.addListener(this.onWinFocusChanged.bind(this));  // Обработчик смены фокуса окна
  }

  // Получаем текущее состояние JavaScript для окна
  async getState(win) {
    try {
      const data = {
        'primaryUrl': 'http://*',
        'incognito': win.incognito || false
      };
      const state = await chrome.contentSettings.javascript.get(data);
      state.enabled = (state.setting === 'allow');
      return state;
    } catch (error) {
      console.error('Ошибка при получении состояния JavaScript:', error);
    }
  }

  // Устанавливаем состояние JavaScript (разрешить или заблокировать)
  async setState(win, enabled) {
    try {
      const data = {
        'primaryPattern': '<all_urls>',
        'setting': enabled ? 'allow' : 'block',
        'scope': win.incognito ? 'incognito_session_only' : 'regular'
      };
      await chrome.contentSettings.javascript.set(data);
    } catch (error) {
      console.error('Ошибка при установке состояния JavaScript:', error);
    }
  }

  // Переключаем состояние JavaScript
  async toggleState() {
    const win = await chrome.windows.getCurrent();
    const state = await this.getState(win);
    await this.setState(win, !state.enabled);  // Переключаем состояние
    await this.reloadCurrentTab();  // Перезагружаем вкладку
  }

  // Обрабатываем смену окна, но иконка теперь не обновляется
  async onWinFocusChanged() {
    // Никаких действий с иконкой не выполняем
  }

  // Перезагружаем текущую вкладку
  async reloadCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
      const tab = tabs[0];
      if (tab) {
        chrome.tabs.reload(tab.id);  // Перезагружаем вкладку
      }
    } catch (error) {
      console.error('Ошибка при перезагрузке вкладки:', error);
    }
  }
}

const jsWorker = new ToggleJSWorker();

// Обработчик нажатия на кнопку для переключения JavaScript
async function toggleJavaScript() {
  const win = await chrome.windows.getCurrent();
  const state = await jsWorker.getState(win);
  await jsWorker.setState(win, !state.enabled);
  await jsWorker.reloadCurrentTab();
}


chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleJavaScript') {
    const jsWorker = new ToggleJSWorker();
    jsWorker.toggleState();
  }
});