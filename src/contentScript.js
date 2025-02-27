"use strict"

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Communicate with background file by sending a message
chrome.runtime.sendMessage(
  {
    type: "GREETINGS",
    payload: {
      message: "Hello, my name is Con. I am from ContentScript.",
    },
  },
  (response) => {
    console.log(response.message)
  }
)

// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "COUNT") {
    console.log(`Current count is ${request.payload.count}`)
  }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({})
  return true
})

function randomId() {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0]
  return uint32.toString(16)
}

// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PRICE") {
    // console.log("Message GET_PRICE")
    const price_str = (
      document.getElementById("price_inside_buybox_badge") ||
      document.getElementById("priceblock_businessprice") ||
      document.querySelector(".a-size-base.a-text-price:not(#price_vat_excl) span")
    ).innerHTML

    const m = price_str.match(/[\d,]+/)
    const price = m ? parseInt(m[0].replace(/,/g, "")) : undefined

    const name = document.getElementById("title").innerText
    // console.log(price, name)

    const obj = {}
    const id = randomId()
    const asin = document.getElementById("ASIN").getAttribute("value")
    const timestamp = Date.now()
    const max_count = 5
    const min_count = 0
    if (!obj[asin]) {
      obj[asin || "" + timestamp] = {
        price,
        name,
        asin,
        timestamp,
        id,
        max_count,
        min_count,
      }
      chrome.storage.local.set(obj)
    }

    // chrome.runtime.sendMessage({
    //   price,
    //   name,
    // })
    sendResponse({ price, name })
  }
  return true

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
})
