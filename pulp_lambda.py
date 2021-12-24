import json

# coding: UTF-8

# 線形/整数最適化問題を解くためにPuLPをインポート
import pulp

# sys.maxsizeでintの最大値を取得するためにインポート
import sys


def run(total, price):
    y = [None] * len(price)
    names = [p[1] for p in price]

    problem = pulp.LpProblem("Problem-1", pulp.LpMinimize)

    for index in range(len(price)):
        y[index] = pulp.LpVariable("y" + str(index), 0, 2, pulp.LpInteger)

    # problem += pulp.lpSum([y[i] for i in range(len(price))]), "The number of items"

    prices = [y[i] * price[i][0] for i in range(len(price))]
    # prices = [y[i] * price[i] for i in range(len(price))]

    problem += total - pulp.lpSum(prices), "Use as much"

    problem += total == pulp.lpSum(prices), "Use exact"

    problem += pulp.lpSum(prices) <= total, "Do not over"

    for index in range(len(price)):
        if len(price[index]) >= 4:
            # Set minimum
            problem += y[index] >= price[index][3]
        if len(price[index]) >= 3:
            # Set maximum
            problem += y[index] <= price[index][2]

    # 問題の式全部を表示
    print("問題の式")
    print("--------")
    print(problem)
    print("--------")
    print(price)

    # 計算
    result_status = problem.solve()

    # （解が得られていれば）目的関数値や解を表示
    if pulp.LpStatus[result_status] != "Optimal":
        print("解なし")
        return {"ok": False}
    else:
        obj = pulp.value(problem.objective)
        if obj != 0:
            print("解無し 残額: %d" % (obj))
            return {"ok": False}
        else:
            print("")
            print("計算結果")
            print("********")
            print("最適性 = {}".format(pulp.LpStatus[result_status]))
            print("目的関数値 = {}".format(obj))
            print("y = {}".format([int(pulp.value(v)) for v in y]))
            print("********")

            print("      ", price)
            used = 0
            for i, v in enumerate(zip(price, [int(pulp.value(v)) for v in y])):
                p, n = v
                if n > 0:
                    print("{}\t{}\t{}\t{}".format(i, p[0], n, p[1]))
                used += p[0] * n
            print("Total: ", used)
            count = {names[i]: int(pulp.value(y[i])) for i in range(len(y))}
            return {"ok": True, "count": count}


def lambda_handler(event, context):
    vs = run(event["total"], event["items"])
    # TODO implement
    return {"statusCode": 200, "body": json.dumps(vs)}


def test():
    event = {
        "total": 5259,
        "items": [
            [2880, "https://www.amazon.co.jp/gp/product/B07H3QN5GG"],
            [995, "https://www.amazon.co.jp/gp/product/B0838JBX9S"],
            [324, "https://www.amazon.co.jp/gp/product/B000IGXN5A"],
            [851, "https://www.amazon.co.jp/gp/product/B0029M4814"],
            [506, "https://www.amazon.co.jp/gp/product/B005J0X11G"],
            [1799, "https://www.amazon.co.jp/gp/product/B088CWW7Q1"],
            [571, "https://www.amazon.co.jp/gp/product/B0029M485A"],
            [603, "https://www.amazon.co.jp/dp/B00LBNM6MK/"],
            [955, "https://www.amazon.co.jp/dp/B071ZSCMYP"],
            [881, "https://www.amazon.co.jp/dp/B000CED21S"],
        ],
    }
    vs = run(event["total"], event["items"])
    print(vs)


test()