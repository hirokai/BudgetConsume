"use strict"

import "./popup.css"
;(function () {
  // We will make use of Storage API to get and store `count` value
  // More information on Storage API can we found at
  // https://developer.chrome.com/extensions/storage

  function restoreItemList() {
    console.log("restoreItemList")
    const container = document.querySelector("#item-list > tbody")
    container.innerHTML = ""

    // chrome.storage.local.clear()

    chrome.storage.local.get(null, (items) => {
      const urls = []
      const items2 = []
      for (const [k, v] of Object.entries(items)) {
        items2.push([k, v])
      }
      items2.sort((a, b) => {
        return a.timestamp - b.timestamp
      })
      let row_idx = 0
      for (const [k, v] of items2) {
        if (k.indexOf("__") == 0) {
          //
        } else {
          const tr = document.createElement("tr")
          const td0 = document.createElement("td")
          td0.innerText = "x"
          td0.setAttribute("class", "delete")
          td0.setAttribute("data-asin", k)
          td0.addEventListener("click", (ev) => {
            chrome.storage.local.remove(ev.target.getAttribute("data-asin"))
          })
          const td1 = document.createElement("td")
          td1.innerText = ""
          td1.setAttribute("class", "count")
          td1.setAttribute("id", "count-" + v.id)
          td1.setAttribute("data-asin", v.asin)
          const td2 = document.createElement("td")
          td2.setAttribute("class", "price")
          td2.innerText = "" + v.price
          const td3 = document.createElement("td")
          td3.innerText = v.name
          const td4 = document.createElement("td")
          td4.innerHTML = `<a href="https://www.amazon.co.jp/dp/${v.asin}">${v.asin}</a>`
          const a = td4.getElementsByTagName("a")[0]
          a.setAttribute("tabIndex", "-1")
          const td5a = document.createElement("td")
          td5a.innerHTML = `<input type="number" class="min-count" id="min-count-${v.id}" value="${
            v.min_count != undefined ? v.min_count : 0
          }" min="0">`
          td5a.addEventListener("change", (ev) => {
            const min_count = +ev.target.value
            chrome.storage.local.get(v.id, (items) => {
              const obj = {}
              obj[v.asin] = { ...v, min_count }
              // console.log({ v, obj })
              chrome.storage.local.set(obj)
            })
          })
          const td5b = document.createElement("td")
          td5b.innerHTML = `<input type="number" class="max-count" id="max-count-${v.id}" value="${
            v.max_count != undefined ? v.max_count : 1
          }" min="0">`
          td5b.addEventListener("change", (ev) => {
            const max_count = +ev.target.value
            chrome.storage.local.get(v.id, (items) => {
              const obj = {}
              obj[v.asin] = { ...v, max_count }
              // console.log({ v, obj })
              chrome.storage.local.set(obj)
            })
          })
          tr.appendChild(td0)
          tr.appendChild(td2)
          tr.appendChild(td3)
          tr.appendChild(td4)
          tr.appendChild(td5a)
          tr.appendChild(td5b)
          tr.appendChild(td1)
          container.appendChild(tr)
          const calculated_count = items["__calculated"] ? items["__calculated"][v.id] : undefined
          if (calculated_count && calculated_count > 0) {
            urls.push(`https://www.amazon.co.jp/dp/${v.asin}`)
          }
        }
        row_idx += 1
      }
      if (items["__total"] == undefined) {
        chrome.storage.local.set({ __total: 10000 })
      }
      const total_el = document.querySelector("#total-aimed")
      total_el.value = items["__total"] || 10000

      for (const [k, v] of Object.entries(items["__calculated"] || {})) {
        const el = document.getElementById("count-" + k)
        if (el) {
          el.innerText = "" + v
          if (v > 0) {
            el.parentElement.setAttribute("class", "used")
          }
        }
      }
      console.log(urls)
      if (items["__calculated"]) {
        const el = document.getElementById("result-message")
        el.setAttribute("class", "green")
        el.innerHTML = "解が見つかりました <button id='open-tabs'>開く</button>"
        document.getElementById("open-tabs").addEventListener("click", () => {
          for (const url of urls) {
            chrome.tabs.create({ url })
          }
        })
      } else {
        const el = document.getElementById("result-message")
        el.setAttribute("class", "red")
        el.innerText = "解がありません（物品の候補を追加するか，最大数を増やしてください。）"
      }
    })
  }

  function addToList() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      console.log(tab)

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: "GET_PRICE",
        },
        (response) => {
          console.log("Got response", response)
          chrome.storage.local.get(null, function (items) {
            var allKeys = Object.keys(items)
            console.log(allKeys)
          })
        }
      )
    })
  }

  function clearList() {
    chrome.storage.local.get(["__total"], (d) => {
      console.log({ d })
      chrome.storage.local.clear()
      chrome.storage.local.set({ __total: 10000 })
    })
  }

  function setTotal() {
    const total = +document.getElementById("total-aimed").value
    chrome.storage.local.set({ __total: total })
  }

  document.addEventListener("DOMContentLoaded", restoreItemList)

  document.getElementById("add-to-list").addEventListener("click", addToList)

  document.getElementById("clear-list").addEventListener("click", clearList)

  document.getElementById("set-total").addEventListener("click", setTotal)

  chrome.storage.onChanged.addListener(() => {
    restoreItemList()
  })

  // Communicate with background file by sending a message
  chrome.runtime.sendMessage(
    {
      type: "GREETINGS",
      payload: {
        message: "Hello, my name is Pop. I am from Popup.",
      },
    },
    (response) => {
      console.log(response.message)
    }
  )
})()
