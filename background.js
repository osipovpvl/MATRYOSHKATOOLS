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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_DOMAIN") {
    const { domain } = message;

    chrome.storage.sync.get('apiKey', (data) => {
      if (data.apiKey) {
        const apiKey = data.apiKey;
        const apiUrl = `https://checktrust.ru/app.php?r=host/app/summary/basic&applicationKey=${apiKey}&host=${domain}&parameterList=trust,spam`;

        fetch(apiUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            if (data && data.success && data.summary) {
              sendResponse({ 
                trust: data.summary.trust, 
                spam: data.summary.spam 
              });
            } else {
              sendResponse(null); // Ответ на случай ошибки API
            }
          })
          .catch((error) => {
            console.error("Ошибка при запросе API:", error);
            sendResponse(null); // Ответ при ошибке
          });
      } else {
        console.error("API ключ не найден");
        sendResponse(null); // Ответ, если API ключ отсутствует
      }
    });

    return true; // Асинхронный запрос
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
      //console.error('Ошибка при получении состояния JavaScript:', error);
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
      //console.error('Ошибка при установке состояния JavaScript:', error);
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
      //console.error('Ошибка при перезагрузке вкладки:', error);
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

// Устанавливаем состояние JavaScript на основе сохраненного значения
async function applySavedJavaScriptState() {
  const result = await chrome.storage.local.get(['jsEnabled']);
  const jsEnabled = result.jsEnabled !== undefined ? result.jsEnabled : true;

  const windows = await chrome.windows.getAll({ populate: true });
  for (const win of windows) {
    await setJavaScriptState(win, jsEnabled);
  }
}

// Устанавливаем состояние JavaScript
async function setJavaScriptState(win, enabled) {
  try {
    const data = {
      primaryPattern: '<all_urls>',
      setting: enabled ? 'allow' : 'block',
      scope: win.incognito ? 'incognito_session_only' : 'regular',
    };
    await chrome.contentSettings.javascript.set(data);
  } catch (error) {
    console.error('Ошибка при установке состояния JavaScript:', error);
  }
}

// Обработчик сообщения из popup.js
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'toggleJavaScript') {
    const windows = await chrome.windows.getAll({ populate: true });
    for (const win of windows) {
      await setJavaScriptState(win, message.jsEnabled);
    }

    // Перезагружаем текущую вкладку
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  }
});

// Применяем сохраненное состояние при запуске
chrome.runtime.onStartup.addListener(applySavedJavaScriptState);
chrome.runtime.onInstalled.addListener(applySavedJavaScriptState);