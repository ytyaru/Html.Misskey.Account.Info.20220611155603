class MastodonRestClient {
    constructor(domain) {
        this.domain = domain
        this.client = new RestClient()
    }
    async get(endpoint, headers) {
        const res = await this.client.get(`https://${this.domain}/${endpoint}`, headers)
        this.error(res)
        return res
    }
    async post(endpoint, headers, params) {
        const res = await this.client.post(`https://${this.domain}/${endpoint}`, headers, params)
        this.error(res)
        return res
    }
    error(json) {
        console.debug(json)
        if (json.hasOwnProperty('error')) {
            Toaster.toast(json.error, true)
            //this.#toast(json.error, true)
            //sessionStorage.removeItem(`${domain}-app`, JSON.stringify(app));
            sessionStorage.removeItem(`${this.domain}-client_id`);
            sessionStorage.removeItem(`${this.domain}-client_secret`);
            //sessionStorage.removeItem(`status`);
            sessionStorage.removeItem(`${this.domain}-access_token`);
            throw new Error(`マストドンAPIでエラーがありました。詳細はデバッグログやsessionStorageを参照してください。: ${JSON.stringify(json)}`)
        }
    }
}
