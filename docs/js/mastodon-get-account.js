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
        const domain = document.getElementById('mastodon-instance').value
        const isExist = await isExistInstance(domain)
        if (!isExist) { Toaster.toast(`指定したURLやドメイン ${domain} はmastodonのインスタンスでない可能性があります。\napi/v1/instanceリクエストをしても想定した応答が返ってこなかったためです。\n入力したURLやドメイン名がmastodonのインスタンスであるか確認してください。あるいはmastodonの仕様変更が起きたのかもしれません。対応したソースコードを書き換えるしかないでしょう。`, true); return; }
        //sessionStorage.setItem(`domain`, document.getElementById('mastodon-instance').value)
        //const client = new MastodonApiClient(domain, accessToken)
        const authorizer = new MastodonAuthorizer(domain, 'read:accounts')
        authorizer.authorize()
    });
    document.getElementById('get-account').addEventListener('click', async(event) => {
        document.getElementById('mastodon-instance').value
    });
    async function isExistInstance(domain) {
        const client = new MastodonApiClient(domain)
        const json = await client.instance().catch(e=>null)
        if (!json) { return false }
        if (!json.hasOwnProperty('version')) { return false; }
        console.debug(json.version)
        console.debug(`----- ${domain} は正常なmastodonサーバです -----`)
        return true
    }
    async function redirectCallback() { // 認証したあとに戻ってきたらトゥートする
        console.debug(this.domain)
        const url = new URL(location.href)
        if ((url.searchParams.has('code') && url.searchParams.has('domain')) || (url.searchParams.has('error') && url.searchParams.get('domain'))) {
            const domain = url.searchParams.get('domain')
            const authorizer = new MastodonAuthorizer(domain, 'read:accounts')
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
    await redirectCallback()
    document.getElementById('mastodon-instance').focus()
});

