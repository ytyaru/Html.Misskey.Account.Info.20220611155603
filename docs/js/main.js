window.addEventListener('DOMContentLoaded', async(event) => {
    try {
        window.mpurse.updateEmitter.removeAllListeners()
          .on('stateChanged', isUnlocked => console.log(isUnlocked))
          .on('addressChanged', address => console.log(address));
    } catch(e) { console.debug(e) }
    /*
    document.querySelector(`toot-dialog`).addEventListener('toot', async(event) => {
        console.debug('トゥートしました！ここから先はWebComponent,brid.gyと連携させたいが難しそう。brid.gyのAPIがなさそうなのとタイミング問題もある。なので妥協してマストドンAPIの応答からコメントHTMLを作成して即座に表示する。', event.detail);
        const html = new Comment().mastodonResToComment(event.detail.json)
        const comment = document.querySelector(`mention-section`).shadowRoot.querySelector(`#web-mention-comment`)
        comment.innerHTML = html + comment.innerHTML
    });
    */
    document.getElementById('get-account').addEventListener('click', async(event) => {
        const domain = document.getElementById('misskey-instance').value
        const isExist = await isExistInstance(domain)
        if (!isExist) { Toaster.toast(`指定したURLやドメイン ${domain} はmastodonのインスタンスでない可能性があります。\napi/v1/instanceリクエストをしても想定した応答が返ってこなかったためです。\n入力したURLやドメイン名がmastodonのインスタンスであるか確認してください。あるいはmastodonの仕様変更が起きたのかもしれません。対応したソースコードを書き換えるしかないでしょう。`, true); return; }
        //sessionStorage.setItem(`domain`, document.getElementById('misskey-instance').value)
        //const client = new MisskeyApiClient(domain, accessToken)
        //const authorizer = new MastodonAuthorizer(domain, 'read:accounts')
        //const domain = url.searchParams.get('domain')
        const authorizer = await getAuthorizer(domain, ['read:account'])
        authorizer.authorize()
    });
    document.getElementById('get-account').addEventListener('click', async(event) => {
        document.getElementById('misskey-instance').value
    });
    async function isExistInstance(domain) {
        const client = new MisskeyApiClient(domain)
        const json = await client.meta().catch(e=>null)
        if (!json) { return false }
        if (!json.hasOwnProperty('version')) { return false; }
        console.debug(json.version)
        console.debug(`----- ${domain} は正常なmisskeyサーバです -----`)
        return true
    }
    async function getAuthorizer(domain, permissions) { // ミスキーv12.39以降とそれ以前では認証方法が違うため必要。本当はversionをAPIで取得して判定させたかったが、versionを取得できなかったため諦めた。
        const client = new MisskeyApiClient(domain) 
        const json = await client.meta()
        console.debug(json)
        console.debug(json.version)
        const v = json.version.split('.')
        const isMiAuth= (12 <= parseInt(v[0]) && 39 <= parseInt(v[1])) 
        console.debug(`${domain}: ${v}`)
        console.debug('認証方法:', (isMiAuth) ? 'MiAuth' : 'OAuth')
        return (isMiAuth) ? new MisskeyAuthorizerMiAuth(domain) : new MisskeyAuthorizerOAuth(domain)
    }
    async function redirectCallback() {
        const url = new URL(location.href)
        if (url.searchParams.has('token') || url.searchParams.has('session')) {
            //const domain = url.searchParams.get('domain')
            const domain = sessionStorage.getItem(`misskey-domain`);
            const authorizer = await getAuthorizer(domain, ['read:account'])
            console.debug(authorizer )
            const i = await authorizer.redirectCallback()
            if (i) {
                console.debug('----- 認証リダイレクト後 -----')
                const client = new MisskeyApiClient(domain, i)
                const json = await client.i()
                const gen = new MisskeyProfileGenerator(domain)
                document.getElementById('export').innerHTML = gen.generate(json)
                //this.#noteEvent(res)
            }
        }
    }
    await redirectCallback()
    document.getElementById('misskey-instance').focus()
});

