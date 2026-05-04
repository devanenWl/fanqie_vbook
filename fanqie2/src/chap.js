load('config.js');

function formatChapterContent(raw) {
    return raw
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<\/?article[^>]*>/gi, "")
        .replace(/<(h1|p|div|section|blockquote)[^>]*>/gi, "")
        .replace(/<\/(h1|p|div|section|blockquote)>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .replace(/\n/g, "<br>");
}

function execute(url) {
    const regex = /(?:item_id=|\/)(\d+)$/;
    let chap_id = url.match(regex)[1];

    let headers = { "Accept": "application/json" };
    if (api_key) {
        headers["X-API-Key"] = api_key;
    }

    let chapter_url;
    if (enable_translation) {
        chapter_url = chap_api_url + "/api/v1/chapter/" + chap_id + "/translate?lang=" + target_lang + "&refresh=false";
    } else {
        chapter_url = chap_api_url + "/api/v1/chapter/" + chap_id + "?refresh=false";
    }

    let response = fetch(chapter_url, { headers: headers });
    if (response.ok) {
        try {
            let json = response.json();
            let raw = json.data.content;
            let content = formatChapterContent(raw);
            return Response.success(content);
        } catch (e) {
            return Response.error("Failed to parse chapter response: " + e.message);
        }
    }
    return Response.error("Chapter fetch failed: " + response.status + " - " + chap_api_url);
}
