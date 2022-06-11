class MisskeyRestClient {
    constructor(domain) {
        this.domain = domain
        this.client = new RestClient()
    }
    //async get(endpoint, headers) { return this.client.get(`https://${this.domain}/api/${endpoint}`, headers) }
    //async post(endpoint, headers, params) { return this.client.post(`https://${this.domain}/api/${endpoint}`, headers, params) }
    async get(endpoint, headers) {
        const res = await this.client.get(`https://${this.domain}/api/${endpoint}`, headers)
        this.#error(res)
        return res
    }
    async post(endpoint, headers, params) {
        const res = await this.client.post(`https://${this.domain}/api/${endpoint}`, headers, params)
        this.#error(res)
        return res
    }
    #error(json) {
        console.debug(json)
        if (json.hasOwnProperty('error')) {
            Toaster.toast(json.error, true)
            //sessionStorage.removeItem(`${domain}-app`, JSON.stringify(app));
            sessionStorage.removeItem(`${domain}-id`, app.client_id);
            sessionStorage.removeItem(`${domain}-secret`, app.client_secret);
            //sessionStorage.removeItem(`text`);
            sessionStorage.removeItem(`${domain}-accessToken`, json.accessToken);
            throw new Error(`misskey APIでエラーがありました。詳細はデバッグログを参照してください。: ${JSON.stringify(json)}`)
        }
    }
}
