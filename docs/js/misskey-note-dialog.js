class MisskeyNoteDialog extends HTMLElement {
    constructor() {
        super();
        this.domain = []
        this.text = 'いいね！'
        this.imgSrc = null
        this.imgSize = '64'
        this.title = 'ノートする'
        this.okMsg = 'ノートしました！'
        this.ngMsg = 'キャンセルしました。'
    }
    static get observedAttributes() {
        return ['domain', 'text', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
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
#misskey-note-dialog {
    top: 2.5%;
    left: 2.5%;
    padding: 0.25em;
    margin: 0;
    border: 4mm ridge rgba(211, 220, 50, .6);
}
#misskey-note-dialog {
    z-index: 1;
}
.toastify { /* dialog よりも手前に表示したい */
    z-index: 9;
}
#misskey-note-dialog #text {
    padding: 0.25em;
    margin-bottom: 0.5em;
    border: thick solid green;
    border-radius: 0.5em;
    outline: none;
    background-color: #DDDDDD;
}
#misskey-note-dialog #text:focus {
    padding: 0.25em;
    border: thick solid green;
    border-radius: 0.5em;
    background-color: #FFFFFF;
    outline: none;
}
#misskey-note-dialog textarea {
    width: 200px;
    height: 200px;
}
#misskey-note-dialog a:focus img {
    border: thick double #32a1ce;
}
#misskey-note-button {
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
        button.setAttribute('id', 'misskey-note-button')
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
        //return `./asset/image/mastodon_mascot.svg`
        return `./asset/image/misskey.png`
    }
    #makeDialog() {
        const dialog = document.createElement('dialog')
        dialog.setAttribute('id', 'misskey-note-dialog')
        const form = document.createElement('form')
        form.setAttribute('method', 'dialog')

        const text = document.createElement('div')
        text.setAttribute('id', 'text')
        text.setAttribute('contenteditable', 'true')
        const remaining = document.createElement('span')
        remaining.setAttribute('id', 'text-remaining')

        // ボタン生成
        const buttons = []
        for (const domain of this.domain) {
            buttons.push(`<misskey-note-button domain="${domain}"></misskey-note-button>`)
        }
        buttons.push(`<misskey-note-button></misskey-note-button>`)
        buttons.push(`<button id="misskey-note-dialog-close"><span style="font-size:${this.imgSize}px;">❌</span></button>`)

        form.appendChild(text)
        form.appendChild(remaining)
        form.innerHTML += buttons.join('')
        dialog.appendChild(form)
        return dialog
    }
    #addListenerEvent(shadow) { // ノートボタンを押したときの動作を実装する
        console.debug(this.shadowRoot)
        //this.shadowRoot.getElementById('misskey-note-button').addEventListener('pointerdown', (event) => {
        this.shadowRoot.getElementById('misskey-note-button').addEventListener('click', (event)=>{ console.debug('click', event.target); this.#show(event.target) });
        /* clickとあわせて２回発行されてしまう！　もうスマホ側は知らん。
        this.shadowRoot.getElementById('misskey-note-button').addEventListener('pointerdown', (event) => {
            // なぜかthis.#show(event.target)だとフォーカスが当たらない。clickなら成功するがpointerdownだと失敗する理由が不明。なのでもうclickイベントを発火させることにした。
            this.shadowRoot.getElementById('text').dispatchEvent(new Event('click'))
        });
        */
        console.debug('--------------------------')
        console.debug(this.shadowRoot.getElementById('text'))
        this.shadowRoot.getElementById('text').addEventListener('input', (event) => {
            const LIMIT = 2000
            const remaining = LIMIT - event.target.innerText.length
            console.debug(remaining)
            this.shadowRoot.getElementById('text-remaining').textContent = remaining;
            console.debug(event.target.innerText)
            // ノートしたときtextが空値になる問題への対応。ボタンの数だけデータが冗長になってしまうが、TootButton側を改変せずに済む。
            for (const button of this.shadowRoot.querySelectorAll(`misskey-note-button`)) {
                button.setAttribute('text', this.shadowRoot.getElementById('text').innerText)
                console.debug(button.getAttribute('text'))
            }
        });
        //for (const button of this.shadowRoot.getElementsByName('misskey-note-button')) {
        for (const button of this.shadowRoot.querySelectorAll(`misskey-note-button`)) {
            /*
            ノートしたときtextが空値になる問題。
            TootButtonのほうでもclickイベントを実装していて、そちらでnoteをリクエストしている。が、そこで渡すtextはここでセットしている。両方で定義されたclickイベントのうち、どちらが先に実行されるのか不定なのでは？
            button.addEventListener('click', (event) => {
                //event.target.classList.add('jump');
                console.debug('ノートボタンを押した。値を渡す。')
                event.target.setAttribute('text', this.shadowRoot.getElementById('text').innerText)
            });
            button.addEventListener('pointerdown', (event) => {
                //event.target.classList.add('jump');
                console.debug('ノートボタンを押した。値を渡す。')
                event.target.setAttribute('text', this.shadowRoot.getElementById('text').innerText)
            });
            */
            button.addEventListener('click', (event) => {event.target.setAttribute('text', this.shadowRoot.getElementById('text').innerText)});
            // clickとpointerdownで２回発行されてしまう！
            //button.addEventListener('pointerdown', (event) => {event.target.setAttribute('text', this.shadowRoot.getElementById('text').innerText)});
            button.addEventListener('note', (event) => {
                console.debug(event)
                console.debug(event.detail)
                console.debug(JSON.stringify(event.detail))
                if (event.detail.hasOwnProperty('error')) { Toaster.toast('ノートに失敗しました……') }
                else {
                    Toaster.toast('ノートしました！')
                    this.shadowRoot.getElementById('misskey-note-dialog').close()
                    console.debug(event.target)
                    console.debug(event.detail)
                    this.dispatchEvent(new CustomEvent('note', {detail: event.detail}));
                }
                //document.getElementById('res').value = JSON.stringify(event.json)
            });
        }
        this.shadowRoot.getElementById('misskey-note-dialog-close').addEventListener('keydown', (event) => {
            if ('Tab' === event.key && !event.shiftKey) {
                event.preventDefault()
                this.shadowRoot.getElementById('text').focus()
            }
        });
        this.shadowRoot.getElementById('text').addEventListener('keydown', (event) => {
            if ('Tab' === event.key && event.shiftKey) {
                event.preventDefault()
                this.shadowRoot.getElementById('misskey-note-dialog-close').focus()
            }
        });
        document.addEventListener('click', (event) => {
            if(!event.target.closest(`misskey-note-dialog`)) {
                this.shadowRoot.getElementById('text').dispatchEvent(new Event('input'))
                this.shadowRoot.getElementById('misskey-note-dialog').close();
            }
        });
        this.shadowRoot.getElementById('misskey-note-dialog').addEventListener('keydown', (event) => {
            if ('Escape' === event.key) {
                event.preventDefault()
                this.shadowRoot.getElementById('text').dispatchEvent(new Event('input'))
                this.shadowRoot.getElementById('misskey-note-dialog').close();
            }
        });
    }
    #show(target) {
        target.classList.add('jump');
        //this.shadowRoot.getElementById('misskey-note-dialog').showModal();
        this.shadowRoot.getElementById('misskey-note-dialog').show();
        const text = this.shadowRoot.getElementById('text');
        console.log(this.shadowRoot.querySelector(`misskey-note-button[text]`))
        text.innerText = (this.shadowRoot.querySelector(`misskey-note-button[text]`)) ? this.shadowRoot.querySelector(`misskey-note-button[text]`).getAttribute('text') : this.text + '\n' + location.href
        this.shadowRoot.getElementById('text').dispatchEvent(new Event('input'))
        console.log(this.shadowRoot.getElementById('text-remaining').innerHTML)
        text.focus();
        //this.#setCaretStart(text)
        //this.shadowRoot.getElementById('text').dispatchEvent(new Event('input'))
    }
    #setCaretStart(target) { // キャレットを先頭にセットする
        //text.setSelectionRange(0, 0);
        var range = document.createRange()
        var sel = window.getSelection()
        range.setStart(target.childNodes[0], 0)
        //range.setEnd(target.childNodes[0], 0)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('misskey-note-dialog', MisskeyNoteDialog);
});

