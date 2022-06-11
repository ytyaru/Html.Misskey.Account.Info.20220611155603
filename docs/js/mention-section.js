class MentionSection extends HTMLElement {
    /*
    <mention-section
     comment=30
     like=10
     bookmark=5
     rsvp=5
    ></mention-section>
    */
    constructor(domain) {
        super();
        this.comment = 30
        this.like = 10
        this.bookmark = 5
        this.rsvp = 5
    }
    static get observedAttributes() { return ['comment', 'like', 'bookmark', 'rsvp']; }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) { return; }
        else { this[property] = parseInt(newValue); }
    }
    async connectedCallback() {
        //const shadow = this.attachShadow({ mode: 'closed' });
        const shadow = this.attachShadow({ mode: 'open' }); // マウスイベント登録に必要だった。CSS的にはclosedにしたいのに。
        const gen = new MentionSectionGenerator()
        shadow.innerHTML = `<style>${gen.generateCss()}</style>`
        shadow.innerHTML += gen.generateFrame()
        console.log(this.shadowRoot)
        const m = new WebMention(this.shadowRoot, this.comment, this.like, this.bookmark, this.rsvp) 
        m.make()
        //shadow.innerHTML = `<style>${this.#cssBase()}</style>${button.outerHTML}`
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    customElements.define('mention-section', MentionSection);
});
class MentionSectionGenerator {
    generateCss() { return `
#web-mention-count {
    cursor: pointer;
    text-decoration: underline dotted;
}
#web-mention-counts, #web-mention-like, #web-mention-bookmark, #web-mention-rsvp {
    cursor: pointer;
    display: inline;
}
#web-mention-comment {
    height: 300px;
    overflow-y: scroll;
    border-top: 1px dashed;
}
.mention {
    border-radius: 1em;
    border-color: #000;
    border-style: solid; 
    border-width: 1px; 
    padding: 0.5em;
    margin: 0.5em;
}
.mention-meta a, .mention-meta img, .mention-meta span {
    vertical-align: middle;
}
.mention-url { text-decoration: none; }
.tippy-box[data-theme~="custom"] {
  background-color: #f7f7f7;
  color: black;
  border: 1px solid #ededed;
  border-radius: 0;
}
.tippy-arrow { background-color: #f7f7f7; }`
    }
    generateFrame() { return `
<div id="web-mention-counts">
    <span id="web-mention-count"></span>
    <div id="web-mention-like" title="いいね！">
        <span id="web-mention-like-icon">♥</span>
        <span id="web-mention-like-count">0</span>
        <span id="web-mention-like-author"></span>
    </div>
    <div id="web-mention-bookmark" title="ブックマーク">
        <span id="web-mention-bookmark-icon">🔖</span>
        <span id="web-mention-bookmark-count">0</span>
        <span id="web-mention-bookmark-author"></span>
    </div>
    <div id="web-mention-rsvp" title="出欠確認">
        <span id="web-mention-rsvp-icon">📅</span>
        <span id="web-mention-rsvp-count">0</span>
        <span id="web-mention-rsvp-author"></span>
    </div>
</div>
<div id="web-mention-comment"></div>`
    }
}
class DateDiff { // 〜時間前のような表記を生成する
    constructor() { this.base = new Date(); this.elapsed = null; this.iso = null; this.target = null;}
    get Base() { return this.base }
    set Base(d) { if (d instanceof Date) { this.base = d } }
    get Elapsed() { return this.elapsed }
    get Iso() { return this.iso }
    static toIso(d) { return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}` }
    static toElapsed(d) {
        const diff = new Date().getTime() - d.getTime() // 現在時刻からの差分
        const elapsed = new Date(diff);
        if (elapsed.getUTCFullYear() - 1970) { return elapsed.getUTCFullYear() - 1970 + '年前' }
        else if (elapsed.getUTCMonth()) { return elapsed.getUTCMonth() + 'ヶ月前' }
        else if (elapsed.getUTCDate() - 1) { return elapsed.getUTCDate() - 1 + '日前' }
        else if (elapsed.getUTCHours()) { return elapsed.getUTCHours() + '時間前' }
        else if (elapsed.getUTCMinutes()) { return elapsed.getUTCMinutes() + '分前' }
        else { return (elapsed.getUTCSeconds() < 1) ? 'たった今' : elapsed.getUTCSeconds() + '秒前' }
    }
    diff (target) { // target: DateまたはepochTime(Date.parse(`ISO8601`)の返り値)
        if (target instanceof Date) { this.target = target }
        else if (Number.isInteger(target)) { this.target = new Date(target) }
        else { throw new Error('引数targetはData型かInteger型であるべきです。') }
        //this.target.setHours(this.target.getHours() + 9) 正しいISO8601形式なら９時間足す必要ない
        const diff = this.base.getTime() - this.target.getTime() // 現在時刻からの差分
        this.elapsed = new Date(diff);
        this.iso = `${this.target.getFullYear()}-${(this.target.getMonth()+1).toString().padStart(2, '0')}-${this.target.getDate().toString().padStart(2, '0')} ${this.target.getHours().toString().padStart(2, '0')}:${this.target.getMinutes().toString().padStart(2, '0')}:${this.target.getSeconds().toString().padStart(2, '0')}`
        if (this.elapsed.getUTCFullYear() - 1970) { return this.elapsed.getUTCFullYear() - 1970 + '年前' }
        else if (this.elapsed.getUTCMonth()) { return this.elapsed.getUTCMonth() + 'ヶ月前' }
        else if (this.elapsed.getUTCDate() - 1) { return this.elapsed.getUTCDate() - 1 + '日前' }
        else if (this.elapsed.getUTCHours()) { return this.elapsed.getUTCHours() + '時間前' }
        else if (this.elapsed.getUTCMinutes()) { return this.elapsed.getUTCMinutes() + '分前' }
        else { return this.elapsed.getUTCSeconds() + '秒前' }
    }
}
class BugIsoEscape { // webmentionのJSON応答値にあるpublishedの日時テキストが不正値である。正しくISO8601形式になっていない。サービスやサーバごと、あるいはアカウントのタイムゾーンごとに異なる値を返すのかもしれない。それに暫定対処するためのコードである。
    constructor(dateDiff=null) {
        this.dateDiff = dateDiff || new DateDiff()
        this.timezone = new RegExp(/[+\-][0-9]{2}:[0-0]{2}$/);
    }
    escape(child) { // サーバごとに異なる書式を正しいISO8601形式に修正する。child:webmention一件あたりのデータ
        const iso = this.#routingServer(child)
        const date = new Date(Date.parse(iso)) // 日時型に変換する
        child.publishedDate = date             // テキスト書式が異なっていてもソートできるよう日付型にしておく
        child.publishedElapsed = this.dateDiff.diff(date) // 現在時刻からの差分をテキスト表現したもの
        child.publishedYmdhms = this.dateDiff.Iso // 現在時刻からの差分をテキスト表現したもの
    }
    #routingServer(child) { // サーバごとに異なる書式を正しいISO8601形式に修正する
        if (!child.published) { return child['wm-received'] } // なんとpublishedがnullになるmentionもあった。やむなくwm-recievedで代用する。たぶんこれはwembentionがこいつを発見した時刻だと思われる。末尾ZのUTC標準時形式だった。
             if (child.url.startsWith('https://twitter.com/')) { return this.#twitter(child.published) }
        else if (child.url.startsWith('https://mstdn.jp/')) { return this.#mstdnjp(child.published) }
        else if (child.url.startsWith('https://pawoo.net/')) { return this.#pawoo(child.published) }
        return child.published
    }
    #mstdnjp(published) { // "2022-05-24T02:49:03"のような値が返ってきた。これはUTC標準時だが末尾にZがついていない
        if (published.match(this.timezone)) { return published } // 将来マストドンが正しく修正したとき用
        if (published.endsWith('Z')) { return published }        // 将来マストドンが正しく修正したとき用
        if (!published.endsWith('Z')) { return published + 'Z' } // 今回はこれだけで大丈夫
        return published
    }
    #pawoo(published) { // "2022-05-29T00:14:22"のような値が返ってきた。これはUTC標準時だが末尾にZがついていない
        return this.#mstdnjp(published)
    }
    #twitter(published) { // "2022-05-27T22:09:18+00:00"のような値が返ってきた。日本ローカル時刻と思われるがタイムゾーン値が+09:00でない。ツイッターはアカウント設定によりアカウントごとにタイムゾーンを設定できたような気がする。その値によってタイムゾーンが変わる？とりま日本からのツイートと仮定して+00:00を+09:00に変換する。でも、タイムゾーンが+00:00地域からのツイートだったら、それも+09:00されてしまう！でも、他に対処のしようがない。とりま日本のみと仮定して暫定処置とする。
        if (published.endsWith('+00:00')) { return published.replace('+00:00', '+09:00') }
        return published
    }
    github(published) { // 未調査

    }
    html(publish) { // 未調査

    }
}
class WebMention {
    constructor(shadowRoot, per=30, like=10, bookmark=5, rsvp=5) {
        this.shadowRoot = shadowRoot
        console.log(shadowRoot)
        console.log(this.shadowRoot)
        this.dateDiff = new DateDiff()
        this.target = location.href
        //this.target = `https://ytyaru.github.io/` // デバッグ用
        this.count = null
        this.per = per
        //this.per = 3 // デバッグ用
        this.page = 0
        this.like = like
        this.bookmark = bookmark 
        this.rsvp = rsvp
        this.bugIso = new BugIsoEscape()
        this.API_URL = 'https://webmention.io/api/mentions.jf2'
        this._addressRegExp = /[a-zA-Z0-9]{34,}/g
    }
    async make() {
        this.dateDiff.Base = new Date()
        await this.#count()
        await this.#mentions()
        this.#addPaginateCommentEventListener()
        this.#addLikeBookmarkRsvpClickEventListener()
    }
    async #count() {
        console.log(this.shadowRoot)
        const res = await fetch(`https://webmention.io/api/count?target=${this.target}`)
        //this.count = this.#getTestCount()
        this.count = await res.json()
        console.debug(this.count)
        //this.shadowRoot.getElementById('web-mention-count').textContent = `${this.count['count']} mensions`
        this.shadowRoot.querySelector(`#web-mention-count`).textContent = `${this.count['count']} mensions`
        this.#setupTippy()
    }
    #setupTippy() {
        tippy('#web-mention-count', {
            theme: 'custom',
            allowHTML: true,
            interactive: true,
            trigger: 'click',
            arrow: false, // 吹き出し矢印の色は変えられなかったので消した
            placement: 'right',
            content: `<a href="https://ytyaru.github.io/">ここのURL</a>を書いて<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-text="いいね！" data-show-count="false" target="_blank" rel="noopener noreferrer">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>すると↓に表示されます。<a href="https://mstdn.jp/" target="_blank" rel="noopener noreferrer">mstdn.jp</a>か<a href="https://pawoo.net/" target="_blank" rel="noopener noreferrer">pawoo</a>でTootしても同じです。`,
        });
    }
    #getTestCount() { return {
        "count": 10,
        "type": {
            "invite": 1,
            "like": 1,
            "bookmark": 1,
            "mention": 1,
            "reply": 1,
            "repost": 1,
            "rsvp-yes": 1,
            "rsvp-maybe": 1,
            "rsvp-interested": 1,
            "rsvp-no": 1,
        }
    }}
    async #mentions() {
        this.#likeBookmarkRsvp()
        this.#comment()
    }
    #bugIso(mentions) { // // サーバ側が返す不正ISO8601を強制修正し、それに沿ってソートし直す
        for (let i=0; i<mentions.children.length; i++) { // サーバ側が返す不正ISO8601を強制修正する
            this.bugIso.escape(mentions.children[i])
        }
        // 日付順に降順ソート（サーバ側のISO8601が不正値なのに、それを基準にしてwebmentionAPIでsort-by,sort-dirしている。それはまちがっているため、正しいISO8601形式に強制修正したのち、再度ソートをかけることで正しい日時と順序になる）
        return mentions.children.sort(function(a, b) { return (a.date > b.date) ? -1 : 1; });
    }
    #getRequestUrl(perPage=20, page=0) {
        const url = new URL(this.API_URL)
        url.searchParams.set('target', this.target);
        url.searchParams.set('sort-by', 'published');
        url.searchParams.set('sort-dir', 'down');
        url.searchParams.set('per-page', perPage || this.per);
        url.searchParams.set('page', page || this.page);
        return url
    }
    async #request(url) {
        const res = await fetch(url)
        const mentions = await res.json()
        const children = this.#bugIso(mentions)
        mentions.children = children
        return mentions
    }
    async #comment() {
        // 複数のwm-property[]を指定しても、なぜか最後に指定したwm-property[]の種類しか取得できなかった。APIのバグ？
        // https://github.com/aaronpk/webmention.io#api
        /*
        const url = this.#getRequestUrl(this.per, this.page)
        url.searchParams.set('wm-property[]', 'in-reply-to');
        url.searchParams.set('wm-property[]', 'mention-of');
        url.searchParams.set('wm-property[]', 'repost-of');
        console.debug(url.searchParams)
        console.debug(url)
        const mentions = await this.#request(url)
        console.debug(mentions)
        */
        const url = this.#getRequestUrl(this.per, this.page)
        console.debug(url)
        const mentions = await this.#request(url)
        console.debug(mentions)
        this.shadowRoot.getElementById('web-mention-comment').innerHTML += mentions.children.filter(child=>child.hasOwnProperty('content')).map(child=>this.#commentTypeA(child)).join('')
    }
    async #likeBookmarkRsvp() {
        const data = new Map()
        data.set('like', {per:this.like, wmProperty:'like-of'})
        data.set('bookmark', {per:this.bookmark, wmProperty:'bookmark-of'})
        data.set('rsvp', {per:this.rsvp, wmProperty:'rsvp'})
        for (const [key,value] of data.entries()) {
            this.#notHasContents(value.per, value.wmProperty, key)
        }
    }
    async #notHasContents(per, wmProperty, id) {
        const url = this.#getRequestUrl(per, 0)
        url.searchParams.set('wm-property', wmProperty);
        const mentions = await this.#request(url)
        this.shadowRoot.getElementById(`web-mention-${id}-count`).innerHTML = (this.count.type.hasOwnProperty(id)) ? this.count.type[id] : 0
        this.shadowRoot.getElementById(`web-mention-${id}-author`).innerHTML += mentions.children.map(child=>this.#author(child.author)).join('')
    }
    #author(author, size=32) {
        const name = author.name
        const photo = author.photo || ''
        return `<a href="${author.url}" title="${author.name}" target="_blank" rel="noopener noreferrer"><img src="${author.photo}" alt="${author.name}" width="${size}" height="${size}"></a>`
    }
    #commentTypeA(child) { // 人、日時、コメント（サーバが返すpublished日時テキストが不統一で正しくISO8601でないからバグる！）
        const content = child.content.html || child.content.text
        return `<div class="mention"><div class="mention-meta">${this.#author(child.author)}　<span title="${child.publishedYmdhms}">${child.publishedElapsed}</span>　<span title="${this.#getMentionTypeName(child)}" class="mention-url"><a href="${child.url}" target="_blank" rel="noopener noreferrer" class="mention-url">${this.#getMentionTypeEmoji(child)}</a></span>　${this.#makeMpurseSendButton(child.content.text)}</div><div>${content}</div></div>`
    }
    #makeMpurseSendButton(content) { // コメント内にアドレスらしき文字列があれば投げモナボタンを配置する
        console.debug(content)
        console.debug(this._addressRegExp)
        const founds = content.match(this._addressRegExp)
        console.debug(founds)
        if (founds) { return `<mpurse-send-button img-size="32" amount="0.00114114" to="${founds[0]}"></mpurse-send-button>` }
        return ''
    }
    #getMentionTypeEmoji(child) {
        switch(child['wm-property']) {
            case 'like-of': return '♥'
            case 'bookmark-of': return '🔖'
            case 'rsvp': return '📅'
            case 'in-reply-to': return '↪'
            case 'repost-of': return '🔃'
            case 'mention-of': return '＠'
            default: throw new Error(`想定外の値です。: ${child.wm-property}`)// 
        }
    }
    #getMentionTypeName(child) {
        switch(child['wm-property']) {
            case 'like-of': return 'いいね！'
            case 'bookmark-of': return 'ブックマーク'
            case 'rsvp': return '出欠確認'
            case 'in-reply-to': return '返信'
            case 'repost-of': return '拡散'
            case 'mention-of': return '言及'
            default: throw new Error(`想定外の値です。: ${child.wm-property}`)// 
        }
    }
    #addPaginateCommentEventListener() {
        const allHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        const mostBottom = allHeight - window.innerHeight;
        const dom = this.shadowRoot.getElementById('web-mention-comment')
        dom.addEventListener('scroll', async()=> {
            const commentsHeight = dom.scrollHeight - dom.clientHeight
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (commentsHeight <= dom.scrollTop) { // 最下端までスクロールした
                console.debug(dom.scrollTop, commentsHeight, '最下端までスクロールした')
                if ((this.per * (this.page+1)) < this.count.count) { console.debug('追加リクエスト'); this.page++; await this.#comment() }
            }
        });
    }
    #addLikeBookmarkRsvpClickEventListener() {
        this.#addNotHasContentTypeClickEventListener('like', this.like)
        this.#addNotHasContentTypeClickEventListener('bookmark', this.bookmark)
        this.#addNotHasContentTypeClickEventListener('rsvp', this.rsvp)
    }
    #addNotHasContentTypeClickEventListener(type='like', initCount=10) {
        const self = this
        const dom = this.shadowRoot.getElementById(`web-mention-${type}`)
        dom.addEventListener('click', async()=> {
            console.debug(type, initCount)
            const modal = new tingle.modal({
                stickyFooter: false,
                closeMethods: ['overlay', 'button', 'escape'],
                closeLabel: "Close",
                cssClass: ['custom-class-1', 'custom-class-2'],
                onOpen: function() { console.debug('modal open'); },
                onClose: function() { console.debug('modal closed'); },
            });
            let author = this.shadowRoot.getElementById(`web-mention-${type}-author`).innerHTML

            let rsvpDom = null
            if ('rsvp' === type) { rsvpDom = self.#makeRsvpDialogInnerHtml() }
            // 残り取得
            if (self.count.type.hasOwnProperty(`${type}`)) {
                if (initCount < self.count.type.like) {
                    const perPage = 100
                    for (let page=0; self.count.type.like<((page+1)*perPage); page++) {
                        const res = await fetch(`https://webmention.io/api/mentions.jf2?target=${self.target}&sort-by=published&sort-dir=down&per-page=${perPage}&page=${page}&wm-property=${type}`)
                        const mentions = await res.json()
                        const children = self.#bugIso(mentions)
                        if ('rsvp' === type) { self.#makeRsvpAuthor(rsvpDom, child) }
                        else {
                            if (0 === page) { author += children.slice(initCount).map(child=>self.#author(child.author)) }
                            else { author += children.map(child=>self.#author(child.author)) }
                        }
                    }
                }
            }
            const icon = this.shadowRoot.getElementById(`web-mention-${type}-icon`)
            const count = this.shadowRoot.getElementById(`web-mention-${type}-count`)
            modal.setContent(icon.innerHTML + count.innerHTML + author);
            modal.open();
        });
    }
    #makeRsvpDialogInnerHtml() {
        const dom = document.createElement(`div`)
        const icons = new Map()
        icons.set('yes', '参加する')
        icons.set('maybe', 'たぶん参加する')
        icons.set('interested', '興味はある')
        icons.set('no', '参加しない')
        icons.set('other', '他')
        for (const value of icons.keys()) {
            if (this.count.type.hasOwnProperty(value) || 'other' === value) {
                dom.innerHTML += `<div id="web-mention-rsvp-${value}"><span id="web-mention-rsvp-${value}-icon">${icons.get(value)}</span><span id="web-mention-rsvp-${value}-count">${this.count}</span><span id="web-mention-rsvp-${value}-author"></span></div>`
            }
        }
        return dom
    }
    #makeRsvpAuthor(dom, child) {
        const rsvp = child.rsvp.toLowerCase()
        const target = dom.getElementById(`web-mention-rsvp-${rsvp}-author`)
        if (!target) { target = this.shadowRoot.getElementById(`web-mention-rsvp-other-author`) }
        target.innerHTML += this.#author(child.author)
    }
    #getTestChildren() {
        return [
            {
              "type": "entry",
              "author": {
                "type": "card",
                "name": "Tantek Çelik",
                "url": "http://tantek.com/",
                "photo": "http://tantek.com/logo.jpg"
              },
              "url": "http://tantek.com/2013/112/t2/milestone-show-indieweb-comments-h-entry-pingback",
              "published": "2013-04-22T15:03:00-07:00",
              "wm-received": "2013-04-25T17:09:33-07:00",
              "wm-id": 900,
              "content": {
                "text": "Another milestone: @eschnou automatically shows #indieweb comments with h-entry sent via pingback http://eschnou.com/entry/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html",
                "html": "Another milestone: <a href=\"https:\/\/twitter.com\/eschnou\">@eschnou<\/a> automatically shows #indieweb comments with h-entry sent via pingback <a href=\"http:\/\/eschnou.com\/entry\/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html\">http:\/\/eschnou.com\/entry\/testing-indieweb-federation-with-waterpigscouk-aaronpareckicom-and--62-24908.html<\/a>"
              },
              "mention-of": "https://indieweb.org/",
              "wm-property": "mention-of",
              "wm-private": false
            },
        ]
    }
}
