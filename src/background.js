"use strict"

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GREETINGS") {
    const message = `Hi ${
      sender.tab ? "Con" : "Pop"
    }, my name is Bac. I am from Background. It's great to hear from you.`

    // Log message coming from the `request` parameter
    console.log(request.payload.message)
    // Send a response message
    sendResponse({
      message,
    })
  } else if (request.type == "PRICE") {
    console.log(request.payload)
    const obj = {}
    const id = "" + Date.now()
    obj[id] = request.payload
    chrome.storage.local.set(obj)
  }
})

chrome.storage.onChanged.addListener(() => {
  chrome.storage.local.get(null, (items) => {
    console.log(items)
    const data = {
      total: items["__total"],
      items: [],
    }

    for (const [k, v] of Object.entries(items)) {
      if (k.indexOf("__") != 0) {
        data.items.push([v.price, v.id, v.max_count, v.min_count || 0])
      }
    }
    const url = "https://979ziepbpc.execute-api.ap-northeast-1.amazonaws.com/default/linear_programming"
    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((r) => {
        return r.json()
      })
      .then((result) => {
        const data = JSON.parse(result.body)
        console.log("Response from AWS backend", data)
        if (data.count) {
          const obj = {}
          obj["__calculated"] = data.count
          chrome.storage.local.set(obj)
          chrome.storage.local.get(null, (items) => {
            console.log({ items })
          })
        } else {
          chrome.storage.local.remove("__calculated")
        }
      })
  })
})
