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

// Функция копирования текста
function copyText(id) {
    const textElement = document.getElementById(id);
    const textarea = document.getElementById('hidden-textarea');
    textarea.value = textElement.textContent;
    textarea.select();
    try {
       
        document.execCommand('copy');
        
        
        const button = textElement.nextElementSibling;
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 300);
    } catch (err) {
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copy-bitcoin-button').addEventListener('click', function() {
        copyText('bitcoin-address');
    });
    document.getElementById('copy-ethereum-button').addEventListener('click', function() {
        copyText('ethereum-address');
    });
});