import json
import pulp
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
        if len(price[index]) >= 3:
            problem += y[index] <= price[index][2]

    # problem += y[0] <= 1
    # problem += y[4] <= 2
    # problem += y[5] <= 2

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
            print("　 y = {}".format([int(pulp.value(v)) for v in y]))
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
            [2880, "Item 1"],
            [995, "Item 2"],
            [324, "Item 3"],
            [851, "Item 4"],
            [506, "Item 5"],
            [1799, "Item 6"],
            [571, "Item 7"],
            [603, "Item 8"],
            [955, "Item 9"],
            [881, "Item 10"],
        ],
    }
    vs = run(event["total"], event["items"])
    print(vs)


test()