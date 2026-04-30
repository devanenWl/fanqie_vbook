load('config.js');

function execute(url) {
    const regex = /(?:book_id=|\/)(\d+)$/;
    let book_id = url.match(regex)[1];

    let apiUrl = "https://fanqienovel.com/api/reader/directory/detail?bookId=" + book_id;
    let response = fetch(apiUrl);
    if (!response.ok) {
        return null;
    }

    let json = response.json();
    let chapterList = json.data.chapterListWithVolume;
    if (!chapterList) {
        return null;
    }

    const result = [];
    for (var v = 0; v < chapterList.length; v++) {
        var volume = chapterList[v];
        for (var i = 0; i < volume.length; i++) {
            var chapter = volume[i];
            result.push({
                name: chapter.title,
                url: config_host + "/reader/" + chapter.itemId,
                host: config_host
            });
        }
    }
    return Response.success(result);
}
