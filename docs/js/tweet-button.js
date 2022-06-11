class TweetButton extends HTMLElement {
    /*
    <tweet-button
      text="ツイートしたい内容\n改行"
      url="ツイートに含めたいURL"
      hashtags="tag1,tag2,tag3"
      title="マウスオーバーで表示される"
      src="https://example.com/tweet-button.svg"
      size="64"
    ></tweet-button>
    */
    constructor(domain) {
        super();
        this.text = null
        this.url = location.href
        this.hashtags = null
        this._title = null // 変数名をthis.titleにしてしまうと"null"というテキストになってしまう！
        this.src = null
        this.size = '64'
    }
    static get observedAttributes() {
        return ['text', 'url', 'hashtags', 'title', 'src', 'size'];
    }
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'closed' });
        //const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const gen = new TweetButtonGenerator()
        const button = await gen.generate(this.#getOptions())
        shadow.innerHTML = button.outerHTML
        //shadow.innerHTML = `<style>${this.#cssBase()}</style>${button.outerHTML}`
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        else if ('text' === property) { this.text = newValue.replace('\\n', '\n') }
        else if ('size' === property) { this.size = parseInt(newValue) }
        else { this[property] = newValue; }
    }
    #getOptions() {
        const options = {}
        if (this.text) { options.text = this.text }
        if (this.url) { options.url = this.url }
        if (this.hashtags) { options.hashtags = this.hashtags }
        if (this._title) { options.title = this._title }
        if (this.src) { options.src = this.src }
        if (this.size) { options.size = this.size }
        console.log(options)
        return options
    }
    #cssBase() { return `img{cursor:pointer; text-align:center; vertical-align:middle; user-select:none;}` }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('tweet-button', TweetButton);
});
class TweetButtonGenerator {
    constructor() {
        this.options = null
    }
    async generate(options) {
        this.options = options
        console.log(options)
        const a = await this.#makeA(options)
        const img = this.#makeImg(options)
        a.appendChild(img)
        return a
    }
    async #makeA() {
        const a = document.createElement('a')
        const url = new URL('https://twitter.com/share')
        console.log(this.options)
        if (this.options.hasOwnProperty('text') && this.options.text) { url.searchParams.set('text', this.options.text + await this.#getAddress()) }
        if (this.options.hasOwnProperty('url') && this.options.url) { url.searchParams.set('url', this.options.url + '\n' + this.#getBridgy()) }
        if (this.options.hasOwnProperty('hashtags') && this.options.hashtags) { url.searchParams.set('hashtags', this.options.hashtags) }
        a.setAttribute('href', url.href)
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
        if (this.options.hasOwnProperty('title') && this.options.title) { a.setAttribute('title', this.options.title) }
        return a
    }
    async #getAddress() { return (window.hasOwnProperty('mpurse')) ? '\n' + await window.mpurse.getAddress() : '' }
    #getBridgy() { return 'https://brid.gy/publish/twitter' } // https://brid.gy/about#webmentions
    #makeImg() {
        const img = document.createElement('img')
        img.classList.add('tweet-button')
        const size = (this.options.hasOwnProperty('size')) ? this.options.size : 64
        img.setAttribute('width', size)
        img.setAttribute('height', size)
        img.setAttribute('src', this.#getImgSrc(this.options))
        return img
    }
    #getImgSrc() {
        if (this.options.hasOwnProperty('src')) { return this.options.src }
        return `data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDQwMCA0MDAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwMCA0MDA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQoJLnN0MHtmaWxsOiMxQjlERjA7fQ0KCS5zdDF7ZmlsbDojRkZGRkZGO30NCjwvc3R5bGU+DQo8ZyBpZD0iRGFya19CbHVlIj4NCgk8Y2lyY2xlIGNsYXNzPSJzdDAiIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjIwMCIvPg0KPC9nPg0KPGcgaWQ9IkxvZ29fX3gyMDE0X19GSVhFRCI+DQoJPHBhdGggY2xhc3M9InN0MSIgZD0iTTE2My40LDMwNS41Yzg4LjcsMCwxMzcuMi03My41LDEzNy4yLTEzNy4yYzAtMi4xLDAtNC4yLTAuMS02LjJjOS40LTYuOCwxNy42LTE1LjMsMjQuMS0yNQ0KCQljLTguNiwzLjgtMTcuOSw2LjQtMjcuNyw3LjZjMTAtNiwxNy42LTE1LjQsMjEuMi0yNi43Yy05LjMsNS41LTE5LjYsOS41LTMwLjYsMTEuN2MtOC44LTkuNC0yMS4zLTE1LjItMzUuMi0xNS4yDQoJCWMtMjYuNiwwLTQ4LjIsMjEuNi00OC4yLDQ4LjJjMCwzLjgsMC40LDcuNSwxLjMsMTFjLTQwLjEtMi03NS42LTIxLjItOTkuNC01MC40Yy00LjEsNy4xLTYuNSwxNS40LTYuNSwyNC4yDQoJCWMwLDE2LjcsOC41LDMxLjUsMjEuNSw0MC4xYy03LjktMC4yLTE1LjMtMi40LTIxLjgtNmMwLDAuMiwwLDAuNCwwLDAuNmMwLDIzLjQsMTYuNiw0Mi44LDM4LjcsNDcuM2MtNCwxLjEtOC4zLDEuNy0xMi43LDEuNw0KCQljLTMuMSwwLTYuMS0wLjMtOS4xLTAuOWM2LjEsMTkuMiwyMy45LDMzLjEsNDUsMzMuNWMtMTYuNSwxMi45LTM3LjMsMjAuNi01OS45LDIwLjZjLTMuOSwwLTcuNy0wLjItMTEuNS0wLjcNCgkJQzExMC44LDI5Ny41LDEzNi4yLDMwNS41LDE2My40LDMwNS41Ii8+DQo8L2c+DQo8L3N2Zz4NCg0K`
    }
}
