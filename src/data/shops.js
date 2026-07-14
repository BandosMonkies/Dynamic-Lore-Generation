export const shopsData = {
  merchant_v1: {
    merchantId: "merchant_v1",
    inventory: ["potion", "rice"],
    buyPriceMultiplier: 1.0, // sells to player at 100% item value
    sellPriceMultiplier: 0.5, // buys from player at 50% item value
    stock: {
      potion: 10,
      rice: 20
    }
  },
  merchant_v2: {
    merchantId: "merchant_v2",
    inventory: ["iron_ore", "ashigaru_armor"],
    buyPriceMultiplier: 1.1, // sells at 110% value
    sellPriceMultiplier: 0.6, // buys at 60% value
    stock: {
      iron_ore: 15,
      ashigaru_armor: 2
    }
  },
  merchant_v3: {
    merchantId: "merchant_v3",
    inventory: ["katana", "lucky_charm", "potion"],
    buyPriceMultiplier: 1.2, // sells at 120% value
    sellPriceMultiplier: 0.7, // buys at 70% value
    stock: {
      katana: 2,
      lucky_charm: 3,
      potion: 5
    }
  }
};
