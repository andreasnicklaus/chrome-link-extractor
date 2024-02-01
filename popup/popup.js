chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(tabs[0].id, { type: "getAll" }, function (response) {
    console.log(response)
    if (response?.emails) document.getElementById("emaillist").replaceChildren(...createLiList(response.emails, true));
    if (response?.urls) document.getElementById("urllist").replaceChildren(...createLiList(response.urls));
  });
});

const MAX_LINK_LENGTH = 70

function createLiList(links, isEmailList = false) {
  if (links.length == 0) {
    const p = document.createElement("p")
    p.textContent = "No links found..."
    return [p]
  }
  return links.map(link => {
    const li = document.createElement("a")
    li.classList.add("list-group-item");
    li.classList.add("list-group-item-action");
    li.classList.add("align-items-center");
    li.classList.add("justify-content-between");
    li.classList.add("d-flex");
    li.setAttribute("href", "#")
    li.onclick = function () {
      chrome.tabs.create({ url: link })
      return false
    }

    const a = document.createElement("a")
    a.setAttribute("href", link)

    if (isEmailList) {
      a.textContent = link
      link = "mailto:" + link
    } else {
      const domain = link.split("/").slice(0, 3).join("/")
      let path = link.split("/").slice(3).join("/")
      if (path.length >= MAX_LINK_LENGTH) path = path.substring(0, MAX_LINK_LENGTH - 3) + "..."
      a.textContent = domain + "/" + path
    }
    a.onclick = function () {
      chrome.tabs.create({ url: link })
      return false
    }
    a.style.marginRight = "20px"
    li.appendChild(a)

    const buttonGroup = document.createElement("div")
    buttonGroup.classList.add("btn-group")

    const buttonOpen = document.createElement("button")
    buttonOpen.classList.add("btn")
    buttonOpen.onclick = function () {
      chrome.tabs.create({ url: link })
      return false
    }
    const openIcon = document.createElement("span")
    openIcon.classList.add("octicon")
    openIcon.classList.add("octicon-link-external")
    buttonOpen.appendChild(openIcon)
    buttonGroup.appendChild(buttonOpen)

    const buttonCopy = document.createElement("button")
    buttonCopy.classList.add("btn")
    buttonCopy.onclick = function () {
      const copyLink = link.startsWith("mailto:") ? link.substring(7, Infinity) : link
      console.log("Copying", copyLink)
      navigator.clipboard.writeText(copyLink).then(() => alert("Copied to clipboard: " + copyLink))
      return false
    }
    const copyIcon = document.createElement("span")
    copyIcon.classList.add("octicon")
    copyIcon.classList.add("octicon-clippy")
    buttonCopy.appendChild(copyIcon)
    buttonGroup.appendChild(buttonCopy)

    li.appendChild(buttonGroup)

    return li
  })
}