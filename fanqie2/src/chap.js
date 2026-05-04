load('config.js');

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
            let raw = enable_translation ? json.content : json.data.content;
            let content = escapeHtml(raw).replace(/\n/g, "<br><br>");
            return Response.success(content);
        } catch (e) {
            return Response.error("Failed to parse chapter response: " + e.message);
        }
    }
    return Response.error("Chapter fetch failed: " + response.status + " - " + chap_api_url);
}
