console.log("extension loaded")

chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    if (message.type == "getAll") getAllPages()
      .then(({ emails, urls }) => sendResponse({ emails, urls }))
    return true
  }
)

function loadLinksFromPage(doc) {
  const content = Array.from(doc.querySelectorAll("*"))
    .map(e => [...Array.from(e.attributes)
      .map(a => a.value)
      , e.textContent]
    )
    .flat(Infinity)

  const emails = content
    .map(i => i.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g))
    .flat(Infinity)
    .filter(i => i)
  const urls = content
    .map(i => i.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g))
    .flat(Infinity)
    .filter(i => i)

  return { emails, urls }
}

async function getAllPages() {
  if (window.location.origin.startsWith("https://www.google.com/search") || !window.location.origin.startsWith("https://") && window.location.hostname != "localhost") {
    return loadLinksFromPage(document)
  }

  return fetch("/sitemap.xml").then(response => {
    if (response.ok) {
      return response.text().then(xml => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        const sitemapNodes = xmlDoc.getElementsByTagName("loc");
        const urls = [];

        for (let i = 0; i < sitemapNodes.length; i++) {
          urls.push(sitemapNodes[i].textContent + "/");
        }

        return Promise.all(urls.map(url => {
          try {
            const domain = window.location.origin
            const path = new URL(url).pathname
            url = domain + path
            if (!url.startsWith("https://") && new URL(url).hostname != "localhost") return { emails: [], urls: [] }
            return fetch(url)
              .then(response => {
                if (response.ok) {
                  return response.text().then(html => {
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(html, 'text/html');
                    return loadLinksFromPage(htmlDoc)
                  })
                }
                return { emails: [], urls: [] }
              })
              .catch(() => {
                return { emails: [], urls: [] }
              })
          } catch (e) {
            console.warn(e)
            return { emails: [], urls: [] }
          }
        }))
          .then(emailsAndUrls => {
            let emails = [...new Set(emailsAndUrls.map(i => i.emails).flat())]
            let urls = [...new Set(emailsAndUrls.map(i => i.urls).flat())]
            return { emails, urls }
          })
      })
    }
    else return loadLinksFromPage(document)
  })

}