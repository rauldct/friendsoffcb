const { XMLParser } = require("fast-xml-parser");

async function testFeed(name, url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FriendsOfBarca/1.0 News Aggregator" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.log(name, "-> HTTP", res.status); return; }
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    let items = [];
    if (parsed?.rss?.channel?.item) {
      items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
    } else if (parsed?.feed?.entry) {
      items = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    }

    console.log(name, "->", items.length, "items");
    if (items.length > 0) {
      const i = items[0];
      let link = "";
      if (typeof i.link === "string") link = i.link;
      else if (Array.isArray(i.link)) {
        const alt = i.link.find(l => l["@_rel"] === "alternate");
        link = (alt || i.link[0])?.["@_href"] || "";
      } else if (i.link && typeof i.link === "object") {
        link = i.link["@_href"] || "";
      }
      const title = typeof i.title === "object" ? (i.title["#text"] || JSON.stringify(i.title)) : (i.title || "");
      console.log("  First:", String(title).substring(0, 80));
      console.log("  Link:", String(link).substring(0, 100));
      console.log("  Date:", i.pubDate || i.published || i.updated || "none");
    }
  } catch (e) {
    console.log(name, "-> ERROR:", e.message);
  }
}

(async () => {
  await testFeed("BBC", "https://feeds.bbci.co.uk/sport/football/rss.xml");
  await testFeed("AS", "https://feeds.as.com/mrss-s/list/as/site/as.com/tag/fc_barcelona_a/");
  await testFeed("Marca", "https://e00-marca.uecdn.es/rss/futbol/barcelona.xml");
  await testFeed("Sport.es", "https://www.sport.es/es/rss/barca/rss.xml");
  await testFeed("Guardian", "https://www.theguardian.com/football/barcelona/rss");
  await testFeed("BarcaBlaugranes", "https://www.barcablaugranes.com/rss/index.xml");
  await testFeed("FootballEspana", "https://www.football-espana.net/feed/");
})();
