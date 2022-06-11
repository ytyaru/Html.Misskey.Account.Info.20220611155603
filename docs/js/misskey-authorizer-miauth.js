// https://misskey.m544.net/docs/ja-JP/api
// 12.39.1以降の認証はOAuthでなくMiAuthという独自手法を使うらしい。互換性皆無。
class MisskeyAuthorizerMiAuth { // https://forum.misskey.io/d/6-miauth
    constructor(domain='misskey.io', permissions=null) {
        const url = new URL(location.href)
        url.searchParams.delete('code');
        this.callbackUrl = url.href
        this.domain = domain
        this.permission = (permissions) ? permissions.join(',') : 'write:notes' //カンマ区切り。'write:notes' https://misskey.m544.net/api-doc/#section/Permissions
        this.client = new MisskeyRestClient(this.domain)
    }
    getDefaultJsonHeaders() { return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }}
    getJsonHeaders(headers=null) { return (headers) ? {...this.getDefaultJsonHeaders(), ...headers} : this.getDefaultJsonHeaders() }
    async authorize(text) {
        console.debug('----- misskey v12 authorize -----')
        sessionStorage.setItem(`misskey-domain`, this.domain)
        sessionStorage.setItem(`misskey-text`, text)
        const session = UUIDv4.generate()
        sessionStorage.setItem(`misskey-${this.domain}-session`, session)
        const endpoint = `https://${this.domain}/miauth/${session}`
        /*
        const params = {
            name: `note requester`,
            permission: `write:notes`, // カンマ区切り
            callbackUrl: this.callbackUrl,
            //callbackUrl: this.callbackUrl + `?domain=${this.domain}`,
        };
        */
        /*
        const params = new URLSearchParams()
        //params.set('name', 'note requester v12')
        params.set('name', 'RequesterV12')
        params.set('permission', this.permission)
        params.set('callback', this.callbackUrl)
        //params.set('icon', '')
        const url = `${endpoint}?${params.toString()}`
        */
        const params = new URLSearchParams()
        params.set('callback', this.callbackUrl)
        // なぜか原因不明の応答が返ってこない現象にみまわれる
        // * nameはMyAppでないと返ってこない？
        // * permissionの:をURLエンコードしたら返ってこない？
        // * name,callback,permissionの順でないと返ってこない？
        // * 現在のページでlocation.href = urlしたら返ってこない？（代わりにwindow.open(url)する）
        // 上記すべてを満たしたら返ってきた。マジで意味不明。
        // https://misskey-hub.net/docs/api/
        const url = `${endpoint}?name=MyApp&${params.toString()}&permission=${this.permission}`
        console.log(url)
        const sleep = (second) => new Promise(resolve => setTimeout(resolve, second * 1000))
        await sleep(2)
        //location.href = url
        let newwin = window.open(url);
    }
    async redirectCallback() {
        const url = new URL(location.href)
        console.debug('----- redirectCallback() v12 -----')
        console.debug(url, url.href)
        console.debug(url.searchParams.has('session'), sessionStorage.getItem(`misskey-domain`))
        if (url.searchParams.has('session')) {
            const domain = sessionStorage.getItem(`misskey-domain`);
            const session = sessionStorage.getItem(`misskey-${domain}-session`);
            url.searchParams.delete('session');
            history.replaceState('', '', url.pathname);
            const json = await this.client.post(`miauth/${session}/check`, null, null)
            sessionStorage.setItem(`misskey-token`, json.token)
            sessionStorage.setItem(`misskey-user`, json.user)
            sessionStorage.setItem(`${domain}-i`, json.token)
            return json.token
        }
    }
}
class UUIDv4 {
    static generate() {
        // https://qiita.com/psn/items/d7ac5bdb5b5633bae165
        // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
        // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
        for (let i = 0, len = chars.length; i < len; i++) {
            switch (chars[i]) {
                case "x":
                    chars[i] = Math.floor(Math.random() * 16).toString(16);
                    break;
                case "y":
                    chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                    break;
            }
        }
        return chars.join("");
    }
}

