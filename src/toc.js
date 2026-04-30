load('config.js');

function execute(url) {
    const regex = /(?:book_id=|\/)(\d+)$/;
    let book_id = url.match(regex)[1];
    let pageUrl = `https://fanqienovel.com/page/${book_id}`;

    let response = fetch(pageUrl);
    if (response.ok) {
        let html = response.text();
        let match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
        if (!match) return null;

        let stateRaw = match[1]
            .replace(/:undefined/g, ':null')
            .replace(/:NaN/g, ':null')
            .replace(/:Infinity/g, ':null')
            .replace(/:-Infinity/g, ':null')
            .replace(/,\s*([}\]])/g, '$1');
        let state = JSON.parse(stateRaw);
        let page = state.page;
        if (!page) return null;

        let volumes = page.chapterListWithVolume || [];
        const book = [];
        for (var v = 0; v < volumes.length; v++) {
            let chapters = volumes[v];
            for (var i = 0; i < chapters.length; i++) {
                let ch = chapters[i];
                book.push({
                    name: ch.title,
                    url: config_host + "/content?item_id=" + ch.itemId,
                    host: config_host
                });
            }
        }
        return Response.success(book);
    }
    return null;
}
