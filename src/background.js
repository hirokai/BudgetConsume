"use strict"

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

function solveExact(total, items) {
  console.log("solveExact", total, items)
  // items: [ [price, id, max_count, min_count], ... ]
  // 返り値: { ok: true, count: { [id]: number } } or { ok:false }

  // 1) minを先に引く
  let base = 0
  const normalized = items.map(([price, id, maxC, minC]) => {
    const min = Math.max(0, minC ?? 0)
    const max = Math.max(min, maxC ?? 0)
    base += price * min
    return { price, id, min, max, cap: max - min }
  })

  const target = total - base
  if (target < 0) return { ok: false }

  // target=0 なら min だけで達成
  if (target === 0) {
    const count = {}
    for (const it of normalized) count[it.id] = it.min
    return { ok: true, count }
  }

  // 2) DP: dp[s] = その和が作れるなら「直前状態」を保持して復元
  // prevSum[s] = 直前の和、prevItem[s] = どの品目、prevK[s] = 何個追加
  const prevSum = new Int32Array(target + 1).fill(-1)
  const prevItem = new Int32Array(target + 1).fill(-1)
  const prevK = new Int16Array(target + 1).fill(0)

  prevSum[0] = 0

  for (let i = 0; i < normalized.length; i++) {
    const { price, cap } = normalized[i]
    if (cap === 0) continue

    // 既存dpをベースに、今回の品目を0..cap追加して作れる新しい状態を作る
    // 同じ品目を同一ラウンドで何度も使わないために、現時点の到達可能集合をスナップショット
    const reachable = []
    for (let s = 0; s <= target; s++) if (prevSum[s] !== -1) reachable.push(s)

    for (const s0 of reachable) {
      for (let k = 1; k <= cap; k++) {
        const s1 = s0 + price * k
        if (s1 > target) break
        if (prevSum[s1] === -1) {
          prevSum[s1] = s0
          prevItem[s1] = i
          prevK[s1] = k
        }
      }
    }
    if (prevSum[target] !== -1) break
  }

  if (prevSum[target] === -1) return { ok: false }

  // 3) 復元
  const extra = {}
  let s = target
  while (s !== 0) {
    const i = prevItem[s]
    const k = prevK[s]
    extra[i] = (extra[i] || 0) + k
    s = prevSum[s]
  }

  const count = {}
  for (let i = 0; i < normalized.length; i++) {
    count[normalized[i].id] = normalized[i].min + (extra[i] || 0)
  }
  return { ok: true, count }
}

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
 } else if (request.type === "CALCULATE") {
  chrome.storage.local.get(null, (items) => {
    const total = items["__total"]
    if (typeof total !== "number") {
      sendResponse({ ok: false, error: "__total is not number" })
      return
    }

    const dataItems = []
    for (const [k, v] of Object.entries(items)) {
      if (k.indexOf("__") === 0) continue
      // 念のため数値化（Amazon価格がundefinedのまま入ってると死ぬ）
      const price = Number(v.price)
      const maxc = Number(v.max_count ?? 0)
      const minc = Number(v.min_count ?? 0)
      if (!Number.isFinite(price) || price <= 0) continue
      dataItems.push([price, v.id, maxc, minc])
    }

    const res = solveExact(total, dataItems)

    if (res.ok && res.count) {
      chrome.storage.local.set({ __calculated: res.count }, () => {
        sendResponse({ ok: true })
      })
    } else {
      chrome.storage.local.remove("__calculated", () => {
        sendResponse({ ok: false, error: "no exact solution" })
      })
    }
  })
  return true
}
})
