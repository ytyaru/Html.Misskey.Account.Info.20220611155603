class MisskeyNoteButton extends HTMLElement {
    constructor() {
        super();
        this.domain = null
        this.text = ''
        this.imgSrc = null
        this.imgSize = '64'
        this.title = 'ノートする'
        this.okMsg = 'ノートしました！'
        this.ngMsg = 'キャンセルしました。'
        this._client = null
    }
    static get observedAttributes() {
        return ['domain', 'text', 'img-src', 'img-size', 'title', 'ok-msg', 'ng-msg'];
    }
    async connectedCallback() {
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const gen = new MisskeyNoteButtonGenerator(this.domain, this.imgSrc, this.imgSize, this.title)
        shadow.innerHTML = gen.generate()
        this.shadowRoot.querySelector('img').addEventListener('animationend', (e)=>{ e.target.classList.remove('jump'); e.target.classList.remove('flip'); }, false);
        this.#addListenerEvent()
        this._authorizer = this.#getAuthorizer()
        const i = await this._authorizer.redirectCallback().catch(e=>this.#error(e))
        if (i) {
            console.debug('----- 認証リダイレクト後 -----')
            this._client = new MisskeyApiClient(sessionStorage.getItem(`misskey-domain`), i)
            const res = await this._client.note(sessionStorage.getItem(`misskey-text`)).catch(e=>this.#error(e))
            this.#noteEvent(res)
        }
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        if ('img-src' === property) { this.imgSrc = newValue}
        else if ('img-size' === property) { this.imgSize = newValue}
        else if ('ok-msg' === property) { this.okMsg = newValue}
        else if ('ng-msg' === property) { this.ngMsg = newValue}
        else { this[property] = newValue; }
    }
    #getAuthorizer() { // ミスキーv12.39以降とそれ以前では認証方法が違うため必要。本当はversionをAPIで取得して判定させたかったが、versionを取得できなかったため諦めた。
        return ('misskey.io' == this.domain) ? new MisskeyAuthorizerMiAuth(this.domain) : new MisskeyAuthorizerOAuth(this.domain)
    }
    #error(e) {
        console.error(e)
        this.#clearSettion()
        throw e
    }
    #noteEvent(json) { 
        console.log('----- #noteEvent -----')
        console.log(this.domain)
        console.log(json.createdNote.id)
        const url = `https://${this.domain}/notes/${json.createdNote.id}`
        console.log(url)
        if (WebmentionRequester) {
            new WebmentionRequester().request(url)
        }
        const params = {
            domain: this.domain,
            json: json,
        }
        this.dispatchEvent(new CustomEvent('note', {detail: params}));
        this.#clearSettion()
    }
    #addListenerEvent() { // ノートボタンを押したときの動作を実装する
        //this.addEventListener('pointerdown', async(event) => {
        this.addEventListener('click', async(event) => { console.debug('click note-button'); await this.#note(event.target) });
        // clickとあわせて２回発行されてしまう！　もうスマホ側は知らん。
        //this.addEventListener('pointerdown', async(event) => { console.debug('pointer-down note-button'); this.dispatchEvent(new Event('click')) });
        //this.addEventListener('pointerdown', async(event) => { this.#note() });
    }
    #getText() {
        if (this.text) { return this.text }
        // note-dialogのnote-text要素から取得しようと思ったが、shadow要素のためか取得できなかった。
    }
    #getDomain() {
        const domain = window.prompt('インスタンスのURLかドメイン名を入力してください。');
        try { return new URL(domain).hostname }
        catch (e) { return domain }
    }
    #isExistInstance() {
        // 入力したドメインが存在するか（リンク切れでないか）
        // 入力したドメインはミスキーのインスタンスか（どうやってそれを判定するか）
        return true
    }
    async #note(target) {
        try {
            console.debug('ノートボタンを押しました。')
            const text = this.#getText()
            console.debug(text)
            if (!text || 0 === text.trim().length) {
                this.#toast('ノート内容を入れてください。', true)
                return
            }
            target.classList.add('jump');
            const domain = (this.domain) ? this.domain : this.#getDomain()
            this.domain = domain
            console.debug(domain)
            if (this._client) { // リダイレクト承認済みなら
                console.debug('リダイレクト承認に成功しているため即座にノートします');
                const res = await this._client.note(this.#getText()).catch(e=>this.#error(e))
                this.#noteEvent(res)
            } else { // リダイレクト承認していないなら、それをする
                await this._authorizer.authorize(this.#getText()).catch(e=>this.#error(e))
            }
        } catch(error) {
            console.error(error)
            this.#clearSettion()
        }
    }
    #clearSettion() {
        console.log('----- clearSettion -----', this.domain)
        sessionStorage.removeItem(`${this.domain}-app`)
        sessionStorage.removeItem(`${this.domain}-id`)
        sessionStorage.removeItem(`${this.domain}-secret`)
        sessionStorage.removeItem(`${this.domain}-token`)
        sessionStorage.removeItem(`${this.domain}-domains`)
        sessionStorage.removeItem(`${this.domain}-accessToken`)
        sessionStorage.removeItem(`${this.domain}-i`)
        sessionStorage.removeItem(`misskey-domain`)
        sessionStorage.removeItem(`misskey-${this.domain}-session`)
        sessionStorage.removeItem(`misskey-token`)
        sessionStorage.removeItem(`misskey-user`)
        sessionStorage.removeItem(`misskey-text`)
    }
    #toast(message, error=false) {
        console.debug(message)
        const options = {
            text: message, 
            position:'center'
        }
        if (error) { options.style = { background: "red" } }
        if (Toastify) { Toastify(options).showToast(); }
        else { alert(message) }
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('misskey-note-button', MisskeyNoteButton);
});
class MisskeyNoteButtonGenerator {
    constructor(domain, imgSrc, imgSize, title) {
        this.domain = domain
        this.imgSrc = imgSrc
        this.imgSize = imgSize
        this.title = title
    }
    generate() {
        //const button = this.#make()
        //return `<style>${this.#cssBase()}${this.#cssButton()}${this.#cssAnimation()}${this.#cssFocsAnimation()}</style>${button.outerHTML}` 
        return `<style>${this.#cssBase()}${this.#cssButton()}${this.#cssAnimation()}${this.#cssFocsAnimation()}</style>${this.#make().outerHTML}` 
    }
    #cssBase() { return `img{cursor:pointer; text-align:center; vertical-align:middle; user-select:none;}` }
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
    #make() {
        const button = this.#makeSendButton()
        const img = this.#makeSendButtonImg()
        button.appendChild(img)
        return button
    }
    #makeSendButton() {
        const button = document.createElement('button')
        button.setAttribute('title', (this.domain) ? `${this.domain}へノートする` : `任意のインスタンスへノートする`)
        return button
    }
    #makeSendButtonImg() {
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
        console.debug(this.domain, this.imgSize)
        if (this.imgSrc) { return this.imgSrc }
        //return `http://www.google.com/s2/favicons?domain=${this.domain}`
        if (this.domain) { return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${this.domain}&size=${this.imgSize}` }
        return `./asset/image/misskey.png`
    }
}
