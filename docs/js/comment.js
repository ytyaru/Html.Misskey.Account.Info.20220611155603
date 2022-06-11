class Comment {
    constructor() {
        this._addressRegExp = /[a-zA-Z0-9]{34,}/g
    }
    author(url, name, photo, size) {
        return `<a href="${url}" title="${name}" target="_blank" rel="noopener noreferrer"><img src="${photo}" alt="${name}" width="${size}" height="${size}"></a>`
    }
    comment(content, author, published, publishedElapsed, mentionTypeName, mentionTypeEmoji, url) { // 人、日時、コメント（サーバが返すpublished日時テキストが不統一で正しくISO8601でないからバグる！）
        return `<div class="mention"><div class="mention-meta">${author}　<span title="${published}">${publishedElapsed}</span>　<span title="${mentionTypeName}" class="mention-url"><a href="${url}" target="_blank" rel="noopener noreferrer" class="mention-url">${mentionTypeEmoji}</a></span>　${this.#makeMpurseSendButton(content)}</div><div>${content}</div></div>`
    }
    #makeMpurseSendButton(content) { // コメント内にアドレスらしき文字列があれば投げモナボタンを配置する
        console.debug(content)
        console.debug(this._addressRegExp)
        const founds = content.match(this._addressRegExp)
        console.debug(founds)
        if (founds) { return `<mpurse-send-button img-size="32" amount="0.00114114" to="${founds[0]}"></mpurse-send-button>` }
        return ''
    }
    mastodonResToComment(json) {
        const author = this.author(
            json.account.url,
            json.account.username,
            json.account.avatar,
            32,
        )
        const content = document.createElement('div')
        content.innerHTML = json.content
        const publishedDate = new Date(Date.parse(json.created_at))
        return this.comment(
            content.innerText,
            author,
            DateDiff.toIso(publishedDate),
            DateDiff.toElapsed(publishedDate),
            '言及', '＠', 
            json.url,
        )
    }

}
