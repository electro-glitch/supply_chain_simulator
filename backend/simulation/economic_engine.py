def inflation_effect(base_cost, new_cost, pass_through):
    if base_cost == 0:
        return 0
    diff = new_cost - base_cost
    return diff * pass_through

def shortage_index(demand, supply):
    if supply >= demand:
        return 0
    return (demand - supply) / demand
