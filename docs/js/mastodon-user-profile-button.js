class MastodonUserProfileButton {
    constructor() {
        super();
        this.domain = null
        this._authorizer = null
        this._client = null
    }
    static get observedAttributes() {
        return ['domain'];
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        else { this[property] = newValue; }
    }
    async connectedCallback() {
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const gen = new TootButtonGenerator(this.domain, this.imgSrc, this.imgSize, this.title)
        //shadow.innerHTML = gen.generate()
        document.getElementById('export').innerHTML = gen.generate()
        //this.shadowRoot.querySelector('img').addEventListener('animationend', (e)=>{ e.target.classList.remove('jump'); e.target.classList.remove('flip'); }, false);
        this.#addListenerEvent()
        this.#redirectCallback()
    }
    async #redirectCallback() { // 認証したあとに戻ってきたらトゥートする
        console.debug(this.domain)
        const url = new URL(location.href)
        if ((url.searchParams.has('code') && url.searchParams.has('domain')) || (url.searchParams.has('error') && url.searchParams.get('domain'))) {
            const domain = url.searchParams.get('domain')
            const authorizer = new MastodonAuthorizer(domain, 'write:statuses')
            const accessToken = await authorizer.redirectCallback()
            console.debug('----- 認証リダイレクト後 -----')
            if (accessToken) {
                const client = new MastodonApiClient(domain, accessToken)
                const res = await client.accounts()
                const gen = new ProfileGenerator()
                document.getElementById('export').innerHTML = gen.generate(res)
                //const res = await client.toot(sessionStorage.getItem(`status`))
                //this.#tootEvent(res)
            }
        }
    }
    #tootEvent(json) { 
        const params = {
            domain: this.domain,
            json: json,
        }
        console.log(json.url)
        if (WebmentionRequester) {
            new WebmentionRequester().request(json.url)
        }
        this.dispatchEvent(new CustomEvent('toot', {detail: params}));
        this.#clearSettion()
    }
    #clearSettion() {
        console.log('----- clearSettion -----', this.domain)
        sessionStorage.removeItem(`${this.domain}-app`);
        sessionStorage.removeItem(`${this.domain}-client_id`);
        sessionStorage.removeItem(`${this.domain}-client_secret`);
        sessionStorage.removeItem(`${this.domain}-access_token`);
        sessionStorage.removeItem(`status`);
    }
    #addListenerEvent() { // トゥートボタンを押したときの動作を実装する
        //this.addEventListener('pointerdown', async(event) => {
        this.addEventListener('click', async(event) => { console.debug('click toot-button'); await this.#toot(event.target) });
        // clickとあわせて２回発行されてしまう！　もうスマホ側は知らん。
        //this.addEventListener('pointerdown', async(event) => { console.debug('pointer-down toot-button'); this.dispatchEvent(new Event('click')) });
        //this.addEventListener('pointerdown', async(event) => { this.#toot() });
    }
    #getStatus() {
        if (this.status) { return this.status }
        // toot-dialogのtoot-status要素から取得しようと思ったが、shadow要素のためか取得できなかった。
    }
    #getDomain() {
        const domain = window.prompt('インスタンスのURLかドメイン名を入力してください。');
        try { return new URL(domain).hostname }
        catch (e) { return domain }
    }
    async #isExistInstance(domain) {
        // 入力したドメインが存在するか（リンク切れでないか）
        // 入力したドメインはマストドンのインスタンスか（どうやってそれを判定するか）
        const client = new MastodonApiClient(domain)
        const json = await client.instance().catch(e=>null)
        if (!json) { return false }
        if (!json.hasOwnProperty('version')) { return false; }
        console.debug(json.version)
        //if (!json || !json.hasOwnProperty('version')) { throw new Error(`指定したURLやドメイン ${domain} はmastodonのインスタンスでない可能性があります。api/v1/instanceリクエストをしても想定した応答が返ってこなかったためです。\n入力したURLやドメイン名がmastodonのインスタンスであるか確認してください。あるいはmastodonの仕様変更が起きたのかもしれません。対応したソースコードを書き換えるしかないでしょう。`) }
        console.debug(`----- ${domain} は正常なmastodonサーバです -----`)
        return true
    }
    async #toot(target) {
        console.debug('トゥートボタンを押しました。')
        const status = this.#getStatus()
        console.debug(status)
        if (!status || 0 === status.trim().length) {
            Toaster.toast('トゥート内容を入れてください。', true)
            return
        }
        //event.target.classList.add('jump');
        target.classList.add('jump');
        const domain = (this.domain) ? this.domain : this.#getDomain()
        const isExist = await this.#isExistInstance(domain)
        if (!isExist) { Toaster.toast(`指定したURLやドメイン ${domain} はmastodonのインスタンスでない可能性があります。\napi/v1/instanceリクエストをしても想定した応答が返ってこなかったためです。\n入力したURLやドメイン名がmastodonのインスタンスであるか確認してください。あるいはmastodonの仕様変更が起きたのかもしれません。対応したソースコードを書き換えるしかないでしょう。`, true); return; }
        this.domain = domain
        console.debug(domain)
        const access_token = sessionStorage.getItem(`${domain}-access_token`)
        if (access_token) {
            console.debug('既存のトークンが有効なため即座にトゥートします。');
            if (!this._client) {
                this._client = new MastodonApiClient(this.domain, access_token)
            }
            const res = await this._client.toot(this.#getStatus()).catch(e=>this._client.error(e))
            this.#tootEvent(res)
        } else {
            console.debug('既存のトークンがないか無効のため、新しいアクセストークンを発行します。');
            if (!this._authorizer) { // インスタンス＝ユーザ入力時
                this._authorizer = new MastodonAuthorizer(domain, 'write:statuses')
            }
            console.debug(this._authorizer)
            this._authorizer.authorize(this.#getStatus())
        }
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('mastodon-user-profile-button', MastodonUserProfileButton);
});
class ProfileGenerator {
    constructor() {
        this._addressRegExp = /[a-zA-Z0-9]{34,}/g
    }
    generate(json) {
        const address = this.#getAddress(json)
        const avatar = `<td>${this.#makeAvatar(json)}<br>${this.#makeName(json)}<br></td>`
        const intro = `<td>${this.#makeMpurseSendButton(address)}${address}<br>${this.getName(json)}<br>${json.note}</td>`
        return `<table><tr>${avatar}${intro}</tr></table>`
    }
    #makeAvatar(json) {
        return `<a href="${json.url}"><img src="${json.avatar}" title="${this.#getName(json)}" width="128" height="128"></a>`
    }
    #makeName(json) { return `<a href="${json.url}">${this.#getName(json)}</a>` }
    #getName(json) { return json.display_name || json.username || json.acct }
    #getAddress(json) {
        const founds = json.source.note.match(this._addressRegExp)
        if (0 < founds.length) { return founds[0] }
        for (const field of json.source.fields) {
            if ('モナコイン' == field.name || 'MONACOIN' == field.name.toUpperCase()) {
                const founds = field.value.match(this._addressRegExp)
                if (0 < founds.length) { return founds[0] }
            }
        }
        const founds = json.note.match(this._addressRegExp)
        if (0 < founds.length) { return founds[0] }
        return null
    }
    #makeMpurseSendButton(address) { // マストドンのプロフィール情報にアドレスらしき文字列があれば投げモナボタンを配置する
        return (address) ? `<mpurse-send-button img-size="32" amount="0.00004649" to="${address}"></mpurse-send-button>` : ''
    }
}

