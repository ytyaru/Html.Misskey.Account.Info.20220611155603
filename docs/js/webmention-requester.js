class WebmentionRequester {
    async request(source, target=null) { // json: note応答
        console.debug(`----- WebmentionRequester.request -----`)
        console.debug('source:', source)
        console.debug('target:', target)
        const url = 'https://webmention.io/aaronpk/webmention'
        const params = new URLSearchParams();
        //const sourceUrl = `https://${this.domain}/notes/${json.id}`
        //params.set('source', sourceUrl) // ノートのURL。https://misskey.dev/notes/919xbt0i78 など
        params.set('source', source) // ツイート,トゥート,ノート等のURL。https://misskey.dev/notes/919xbt0i78 など
        params.set('target', (target) ? target : location.href) // コメントを表示するサイトのURL。https://ytyaru.github.io/ など
        const body = params.toString()
        const datas = {
            method: 'POST',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            body: body,
        }
        console.debug(url)
        console.debug(params)
        console.debug(datas)
        const res = await fetch(url, datas)
        console.debug(res)
        const j = await res.json()
        console.debug(j)
        return j
    }
    /*なぜかstaticが消えやがる。
    static async request(source, target=null) { // json: note応答
        const url = 'https://webmention.io/aaronpk/webmention'
        const params = new URLSearchParams();
        //const sourceUrl = `https://${this.domain}/notes/${json.id}`
        //params.set('source', sourceUrl) // ノートのURL。https://misskey.dev/notes/919xbt0i78 など
        params.set('source', source) // ツイート,トゥート,ノート等のURL。https://misskey.dev/notes/919xbt0i78 など
        params.set('target', (target) ? target : location.href) // コメントを表示するサイトのURL。https://ytyaru.github.io/ など
        const body = params.toString()
        const datas = {
            method: 'POST',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            body: body,
        }
        console.debug(url)
        console.debug(params)
        console.debug(datas)
        const res = await fetch(url, datas)
        console.debug(res)
        const j = await res.json()
        console.debug(j)
        return j
    }
    */
}
/*
class WebmentionRequester {
    async request(json) { // json: note応答
        const url = 'https://webmention.io/aaronpk/webmention'
        const params = new URLSearchParams();
        const sourceUrl = `https://${this.domain}/notes/${json.id}`
        params.set('source', sourceUrl) // ノートのURL。https://misskey.dev/notes/919xbt0i78 など
        params.set('target', location.href) // コメントを表示するサイトのURL。https://ytyaru.github.io/ など
        const body = params.toString()
        const datas = {
            method: 'POST',
            headers: {'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            body: body,
        }
        console.debug(url)
        console.debug(params)
        console.debug(datas)
        const res = await fetch(url, datas)
        console.debug(res)
        const j = await res.json()
        console.debug(j)
        return j
    }
}
*/

