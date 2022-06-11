class TootDialog extends HTMLElement {
    constructor() {
        super();
        this.domain = []
        this.status = 'いいね！'
        this.imgSrc = null
        this.imgSize = '64'
        this.title = 'トゥートする'
        this.okMsg = 'トゥートしました！'
        this.ngMsg = 'キャンセルしました。'
    }
    static get observedAttributes() {
        return ['domain', 'status', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
    }
    async connectedCallback() {
        console.debug('=======================================')
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。l

        const button = await this.#makeButton()
        const dialog = await this.#makeDialog()
        shadow.innerHTML = `<style>${this.#makeCss()}</style>${button.outerHTML}${dialog.outerHTML}` 

        console.debug(button.innerHTML)
        //shadow.innerHTML = `<style>${this.#cssBase()}${this.#cssButton()}${this.#cssAnimation()}${this.#cssFocsAnimation()}</style>${button.outerHTML}` 
        // pointer系 = mouse系 + touch系 + pen系
        //this.shadowRoot.querySelector('img').addEventListener('pointerdown', (e)=>{ e.target.classList.add('jump'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('pointerover', (e)=>{ e.target.classList.add('flip'); }, false);
        //this.shadowRoot.querySelector('img').addEventListener('mouseover', (e)=>{ e.target.classList.add('flip'); }, false);
        this.shadowRoot.querySelector('img').addEventListener('animationend', (e)=>{ e.target.classList.remove('jump'); e.target.classList.remove('flip'); }, false);
        this.#addListenerEvent(shadow)
    }
    #makeCss() { return `${this.#cssBase()}${this.#cssButton()}${this.#cssAnimation()}${this.#cssFocsAnimation()}` }
    //#cssBase() { return `img{cursor:pointer; text-align:center; vertical-align:middle; user-select:none;}` }
    #cssBase() { return `
#toot-dialog {
    top: 2.5%;
    left: 2.5%;
    padding: 0.25em;
    margin: 0;
    border: 4mm ridge rgba(211, 220, 50, .6);
}
#toot-dialog {
    z-index: 1;
}
.toastify { /* dialog よりも手前に表示したい */
    z-index: 9;
}
#toot-dialog #status {
    padding: 0.25em;
    margin-bottom: 0.5em;
    border: thick solid green;
    border-radius: 0.5em;
    outline: none;
    background-color: #DDDDDD;
}
#toot-dialog #status:focus {
    padding: 0.25em;
    border: thick solid green;
    border-radius: 0.5em;
    background-color: #FFFFFF;
    outline: none;
}
#toot-dialog textarea {
    width: 200px;
    height: 200px;
}
#toot-dialog a:focus img {
    border: thick double #32a1ce;
}
#toot-button {
    width: auto;
    padding: 0;
    margin: 0;
    background: none;
    border: 0;
    font-size: 0;
    line-height: 0;
    overflow: visible;
    cursor: pointer;
}
.button-table {
    text-align: center;
    vertical-align: center;
}
#toot-dialog-close, #toot-dialog-close > span {
    text-align: center;
    vertical-align: center;
    font-size: ${this.imgSize}px;
}
`
    }
    #cssButton() { return `
button {
    width: auto;
    padding: 0;
    margin: 0;
    background: none;
    border: 0;
    font-size: 0;
    line-height: 0;
    overflow: visible;
    cursor: pointer;
}`
}
    #cssAnimation() { return `
@keyframes jump {
  from {
    position:relative;
    bottom:0;
    transform: rotateY(0);
  }
  45% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  55% {
    position:relative;
    bottom: ${this.imgSize*2}px;
  }
  to {
    position:relative;
    bottom: 0;
    transform: rotateY(720deg);
  }
}
.jump {
  transform-origin: 50% 50%;
  animation: jump .5s linear alternate;
}
@keyframes flip {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(180deg);
  }
}
.flip {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}`; }
    #cssFocsAnimation() { return `
button {
  width: ${this.imgSize}px;
  height: ${this.imgSize}px;
}
/* アニメが完了するまでクリックできなくなる
button:focus {
  transform-origin: 50% 50%;
  animation: flip .20s linear alternate;
}
*/
button, button img {
  width: ${this.imgSize}px;
  height: ${this.imgSize}px;
  z-index: 1;
}
button:focus, button:focus img {
  width: ${this.imgSize * 1.5}px;
  height: ${this.imgSize * 1.5}px;
  z-index: 9999;
  vertical-align:bottom;
}
`
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        if ('domain' === property) { this.domain = newValue.split(' ')}
        else if ('img-src' === property) { this.imgSrc = newValue}
        else if ('img-size' === property) { this.imgSize = newValue}
        else if ('ok-msg' === property) { this.okMsg = newValue}
        else if ('ng-msg' === property) { this.ngMsg = newValue}
        else { this[property] = newValue; }
    }
    async #makeButton() {
        const button = await this.#makeButtonElement()
        const img = this.#makeButtonImg()
        button.appendChild(img)
        return button
    }
    #makeButtonElement() {
        const button = document.createElement('button')
        button.setAttribute('id', 'toot-button')
        button.setAttribute('title', this.title)
        return button
    }
    #makeButtonImg() {
        const img = document.createElement('img')
        const size = this.#parseImgSize()
        const [width, height] = this.#parseImgSize()
        img.setAttribute('width', `${width}`)
        img.setAttribute('height', `${height}`)
        img.setAttribute('src', `${this.#getImgSrc()}`)
        //img.classList.add('flip'); // 初回アニメーション用
        return img
    }
    #getImgWidth() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[0] : this.imgSize) }
    #getImgHeight() { return parseInt( (0 <= this.imgSize.indexOf('x')) ? this.imgSize.split('x')[1] : this.imgSize) }
    #parseImgSize() {
        if (0 <= this.imgSize.indexOf('x')) { return this.imgSize.split('x').map(v=>(parseInt(v)) ? parseInt(v) : 64) }
        else { return (parseInt(this.imgSize)) ? [parseInt(this.imgSize), parseInt(this.imgSize)] : [64, 64] }
    }
    #getImgSrc() {
        return `./asset/image/mastodon_mascot.svg`
    }
    #makeDialog() {
        const dialog = document.createElement('dialog')
        dialog.setAttribute('id', 'toot-dialog')
        const form = document.createElement('form')
        form.setAttribute('method', 'dialog')

        const status = document.createElement('div')
        status.setAttribute('id', 'status')
        status.setAttribute('contenteditable', 'true')
        const remaining = document.createElement('span')
        remaining.setAttribute('id', 'status-remaining')

        const table = document.createElement('table')
        table.classList.add('button-table')
        const trB = document.createElement('tr')
        const trD = document.createElement('tr')
        trB.innerHTML += `<td rowspan="2">${remaining.outerHTML}</td>`
        for (const domain of this.domain) {
            const tdB = document.createElement('td')
            tdB.innerHTML = `<toot-button domain="${domain}"></toot-button>`
            trB.appendChild(tdB)
            const tdD = document.createElement('td')
            tdD.appendChild(this.#makeNewTabLink(`https://${domain}/`, domain, domain))
            trD.appendChild(tdD)
        }
        trB.innerHTML += `<td><toot-button></toot-button></td>`
        trD.innerHTML += '<td>' + this.#makeNewTabLink('https://www.fediverse.space/instances', 'インスタンス一覧（一覧にはマストドン以外のfediverseなサーバも含む。マストドンだけの一覧はない）', '他').outerHTML + '</td>'
        trB.innerHTML += `<td rowspan="2"><button id="toot-dialog-close" title="閉じる"><span>❌</span></button></td>`
        table.appendChild(trB)
        table.appendChild(trD)
        form.appendChild(status)
        form.appendChild(table)
        dialog.appendChild(form)
        return dialog
    }
    #makeNewTabLink(href, title, content) {
        const a = document.createElement('a')
        if (href) { a.setAttribute('href', href) }
        if (title) { a.setAttribute('title', title) }
        if (content) { a.innerHTML = content }
        a.setAttribute('target', '_blank') 
        a.setAttribute('rel', 'noopener noreferrer')
        return a
    }
    #addListenerEvent(shadow) { // トゥートボタンを押したときの動作を実装する
        console.debug(this.shadowRoot)
        //this.shadowRoot.getElementById('toot-button').addEventListener('pointerdown', (event) => {
        this.shadowRoot.getElementById('toot-button').addEventListener('click', async(event)=>{ console.debug('click', event.target); await this.#show(event.target) });
        /* clickとあわせて２回発行されてしまう！　もうスマホ側は知らん。
        this.shadowRoot.getElementById('toot-button').addEventListener('pointerdown', (event) => {
            // なぜかthis.#show(event.target)だとフォーカスが当たらない。clickなら成功するがpointerdownだと失敗する理由が不明。なのでもうclickイベントを発火させることにした。
            this.shadowRoot.getElementById('status').dispatchEvent(new Event('click'))
        });
        */
        console.debug('--------------------------')
        console.debug(this.shadowRoot.getElementById('status'))
        this.shadowRoot.getElementById('status').addEventListener('input', (event) => {
            const LIMIT = 500
            const remaining = LIMIT - event.target.innerText.length
            console.debug(remaining)
            this.shadowRoot.getElementById('status-remaining').textContent = remaining;
            console.debug(event.target.innerText)
            // トゥートしたときstatusが空値になる問題への対応。ボタンの数だけデータが冗長になってしまうが、TootButton側を改変せずに済む。
            for (const button of this.shadowRoot.querySelectorAll(`toot-button`)) {
                button.setAttribute('status', this.shadowRoot.getElementById('status').innerText)
                console.debug(button.getAttribute('status'))
            }
        });
        //for (const button of this.shadowRoot.getElementsByName('toot-button')) {
        for (const button of this.shadowRoot.querySelectorAll(`toot-button`)) {
            /*
            トゥートしたときstatusが空値になる問題。
            TootButtonのほうでもclickイベントを実装していて、そちらでtootをリクエストしている。が、そこで渡すstatusはここでセットしている。両方で定義されたclickイベントのうち、どちらが先に実行されるのか不定なのでは？
            button.addEventListener('click', (event) => {
                //event.target.classList.add('jump');
                console.debug('トゥートボタンを押した。値を渡す。')
                event.target.setAttribute('status', this.shadowRoot.getElementById('status').innerText)
            });
            button.addEventListener('pointerdown', (event) => {
                //event.target.classList.add('jump');
                console.debug('トゥートボタンを押した。値を渡す。')
                event.target.setAttribute('status', this.shadowRoot.getElementById('status').innerText)
            });
            */
            button.addEventListener('click', (event) => {event.target.setAttribute('status', this.shadowRoot.getElementById('status').innerText)});
            // clickとpointerdownで２回発行されてしまう！
            //button.addEventListener('pointerdown', (event) => {event.target.setAttribute('status', this.shadowRoot.getElementById('status').innerText)});
            button.addEventListener('toot', (event) => {
                console.debug(event)
                console.debug(event.detail)
                console.debug(JSON.stringify(event.detail))
                if (event.detail.hasOwnProperty('error')) { this.#toast('トゥートに失敗しました……') }
                else {
                    this.#toast('トゥートしました！')
                    this.shadowRoot.getElementById('toot-dialog').close()
                    console.debug(event.target)
                    console.debug(event.detail)
                    this.dispatchEvent(new CustomEvent('toot', {detail: event.detail}));
                }
                //document.getElementById('res').value = JSON.stringify(event.json)
            });
        }
        this.shadowRoot.getElementById('toot-dialog-close').addEventListener('keydown', (event) => {
            if ('Tab' === event.key && !event.shiftKey) {
                event.preventDefault()
                this.shadowRoot.getElementById('status').focus()
            }
        });
        this.shadowRoot.getElementById('status').addEventListener('keydown', (event) => {
            if ('Tab' === event.key && event.shiftKey) {
                event.preventDefault()
                this.shadowRoot.getElementById('toot-dialog-close').focus()
            }
        });
        document.addEventListener('click', (event) => {
            if(!event.target.closest(`toot-dialog`)) {
                this.shadowRoot.getElementById('status').dispatchEvent(new Event('input'))
                this.shadowRoot.getElementById('toot-dialog').close();
            }
        });
        this.shadowRoot.getElementById('toot-dialog').addEventListener('keydown', (event) => {
            if ('Escape' === event.key) {
                event.preventDefault()
                this.shadowRoot.getElementById('status').dispatchEvent(new Event('input'))
                this.shadowRoot.getElementById('toot-dialog').close();
            }
        });
    }
    async #show(target) {
        target.classList.add('jump');
        //this.shadowRoot.getElementById('toot-dialog').showModal();
        this.shadowRoot.getElementById('toot-dialog').show();
        const status = this.shadowRoot.getElementById('status');
        console.log(this.shadowRoot.querySelector(`toot-button[status]`))
        const address = (window.hasOwnProperty('mpurse')) ? await window.mpurse.getAddress() : ''
        status.innerText = (this.shadowRoot.querySelector(`toot-button[status]`)) ? this.shadowRoot.querySelector(`toot-button[status]`).getAttribute('status') : this.status + '\n' + address + '\n' + location.href
        this.shadowRoot.getElementById('status').dispatchEvent(new Event('input'))
        console.log(this.shadowRoot.getElementById('status-remaining').innerHTML)
        status.focus();
        //this.#setCaretStart(status)
        //this.shadowRoot.getElementById('status').dispatchEvent(new Event('input'))
    }
    #setCaretStart(target) { // キャレットを先頭にセットする
        //status.setSelectionRange(0, 0);
        var range = document.createRange()
        var sel = window.getSelection()
        range.setStart(target.childNodes[0], 0)
        //range.setEnd(target.childNodes[0], 0)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
    }
    #toast(message) {
        console.debug(message)
        if (Toastify) { Toastify({text: message, position:'center'}).showToast(); }
        else { alert(message) }
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('toot-dialog', TootDialog);
});

