class MastodonApiClient extends MastodonRestClient {
    constructor(domain, accessToken) {
        super(domain)
        //this.client = new MastodonRestClient(domain)
        this.accessToken = accessToken
    }
    get #AuthHeader() { return {'Authorization': `Bearer ${this.accessToken}`} }
    #headers(headers=null) { return (headers) ? {...this.#AuthHeader, ...headers} : this.#AuthHeader }
    async instance() { // 認証なしで使える
        console.debug('----- verify_credentials -----')
        return await this.get('api/v1/instance', null, null)
    }
    async verify() { // 認証必須
        console.debug('----- verify_credentials -----')
        return await this.get('api/v1/apps/verify_credentials', this.#AuthHeader, null)
    }
    async accounts() { // 認証必須
        console.debug('----- api/v1/accounts/verify_credentials -----')
        return await this.get('api/v1/accounts/verify_credentials', this.#AuthHeader, null)
    }
    async toot(status) { // 認証必須
        console.debug('----- toot -----')
        console.debug('status:', status)
        const params = {status: status};
        return await this.post('api/v1/statuses', this.#AuthHeader, params)
    }
}
